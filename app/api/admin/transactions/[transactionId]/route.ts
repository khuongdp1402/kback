import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "EXPIRED", "REJECTED"]),
});

/**
 * Manual override for a transaction's status — used when the real affiliate network's postback
 * fails, is delayed, or a dispute needs resolving by hand. Setting status to CONFIRMED stamps
 * confirmedAt so it counts toward the user's wallet balance and membership tier immediately.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { transactionId } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: parsed.data.status,
      confirmedAt: parsed.data.status === "CONFIRMED" ? new Date() : null,
    },
  });

  return NextResponse.json({ transaction });
}
