import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { getMembershipStatus } from "@/lib/membership";

const bodySchema = z.object({
  subId: z.string().min(1),
  confirmNow: z.boolean().optional(),
});

/**
 * Serverless-safe demo conversion trigger for `/demo-checkout`.
 * Only active when `AFFILIATE_PROVIDER` resolves to `mock` (so it can never credit fake money
 * once real affiliate integration is enabled).
 */
export async function POST(request: Request) {
  if (getAffiliateProvider().name !== "mock") {
    return NextResponse.json(
      { error: "Chức năng mô phỏng chỉ hoạt động ở chế độ demo (mock)" },
      { status: 403 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Thiếu mã theo dõi đơn hàng" }, { status: 400 });
  }

  const click = await prisma.click.findUnique({
    where: { trackingId: parsed.data.subId },
    include: { shop: true },
  });

  if (!click || click.userId !== session.user.id) {
    return NextResponse.json({ error: "Không tìm thấy lượt bấm hợp lệ" }, { status: 404 });
  }

  const existing = await prisma.transaction.findUnique({ where: { clickId: click.id } });
  if (existing) {
    if (parsed.data.confirmNow && existing.status === "PENDING") {
      const updated = await prisma.transaction.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      return NextResponse.json({ transaction: updated });
    }
    return NextResponse.json({ transaction: existing });
  }

  const orderAmount = Math.round((200_000 + Math.random() * 1_800_000) / 1000) * 1000;
  const baseCashbackAmount = Math.round(((orderAmount * click.shop.cashbackRate) / 100) * 100) / 100;
  const membership = await getMembershipStatus(click.userId);
  const cashbackAmount = Math.round(baseCashbackAmount * membership.shareRate * 100) / 100;
  const status = parsed.data.confirmNow ? "CONFIRMED" : "PENDING";

  const transaction = await prisma.transaction.create({
    data: {
      userId: click.userId,
      shopId: click.shopId,
      clickId: click.id,
      orderAmount,
      baseCashbackAmount,
      cashbackAmount,
      memberTier: membership.tier,
      status,
      externalOrderId: `MOCK-${click.trackingId.slice(0, 8).toUpperCase()}`,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
