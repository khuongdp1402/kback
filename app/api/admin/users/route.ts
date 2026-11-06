import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { getWalletSummary } from "@/lib/wallet";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { transactions: true, payoutRequests: true } },
    },
  });

  const usersWithWallet = await Promise.all(
    users.map(async (u) => ({ ...u, wallet: await getWalletSummary(u.id) })),
  );

  return NextResponse.json({ users: usersWithWallet });
}
