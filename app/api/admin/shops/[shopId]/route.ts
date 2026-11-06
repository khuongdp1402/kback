import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  logoEmoji: z.string().min(1).optional(),
  network: z.enum(["SHOPEE", "LAZADA", "TIKI", "TIKTOK", "SHOPEEFOOD"]).optional(),
  cashbackRate: z.number().min(0).max(100).optional(),
  baseUrl: z.string().url().optional(),
  description: z.string().optional(),
  accessTradeCampaignId: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { shopId } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const shop = await prisma.shop.update({ where: { id: shopId }, data: parsed.data });
  return NextResponse.json({ shop });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { shopId } = await params;
  await prisma.shop.delete({ where: { id: shopId } });
  return NextResponse.json({ ok: true });
}
