import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const updateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]),
  note: z.string().optional(),
});

/**
 * Manual payout approval — this is the primary payout workflow until a real payment gateway is
 * wired up (see lib/payout/). An admin marks a request APPROVED once they've verified it, then
 * PAID once the bank transfer has actually been sent.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { payoutId } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const payoutRequest = await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: { status: parsed.data.status, note: parsed.data.note },
  });

  return NextResponse.json({ payoutRequest });
}
