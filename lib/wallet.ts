import { prisma } from "@/lib/prisma";

export interface WalletSummary {
  confirmedBalance: number;
  pendingBalance: number;
  paidOut: number;
  availableBalance: number;
}

/**
 * Wallet balance is derived, not stored: confirmed cashback minus amounts already paid out
 * (or in-flight to being paid out).
 */
export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  const [confirmed, pending, payouts] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, status: "CONFIRMED" },
      _sum: { cashbackAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { cashbackAmount: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { userId, status: { in: ["PENDING", "APPROVED", "PAID"] } },
      _sum: { amount: true },
    }),
  ]);

  const confirmedBalance = confirmed._sum.cashbackAmount ?? 0;
  const pendingBalance = pending._sum.cashbackAmount ?? 0;
  const paidOut = payouts._sum.amount ?? 0;
  const availableBalance = Math.max(0, confirmedBalance - paidOut);

  return { confirmedBalance, pendingBalance, paidOut, availableBalance };
}
