import { prisma } from "@/lib/prisma";
import { getWalletSummary } from "@/lib/wallet";
import { getMembershipStatus } from "@/lib/membership";
import { statusLabel, payoutStatusLabel } from "@/lib/transaction-status";
import { MIN_PAYOUT_AMOUNT } from "@/lib/payout/request-payout";
import { requireZaloUser, UNAUTHORIZED_BODY, zaloJson, zaloPreflight } from "@/lib/zalo/http";

export function OPTIONS(request: Request) {
  return zaloPreflight(request);
}

/** Everything the Mini App home/wallet screens need in one round trip. */
export async function GET(request: Request) {
  const user = await requireZaloUser(request);
  if (!user) return zaloJson(request, UNAUTHORIZED_BODY, { status: 401 });

  const [wallet, membership, transactions, payouts] = await Promise.all([
    getWalletSummary(user.id),
    getMembershipStatus(user.id),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { shop: { select: { name: true, logoEmoji: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.payoutRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return zaloJson(request, {
    user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
    wallet,
    minPayoutAmount: MIN_PAYOUT_AMOUNT,
    membership: {
      label: membership.label,
      sharePercent: Math.round(membership.shareRate * 100),
      totalSpend: membership.totalSpend,
      nextLabel: membership.next?.label ?? null,
      amountToNextTier: membership.amountToNextTier,
    },
    transactions: transactions.map((tx) => ({
      id: tx.id,
      shopName: tx.shop.name,
      shopEmoji: tx.shop.logoEmoji,
      orderAmount: tx.orderAmount,
      cashbackAmount: tx.cashbackAmount,
      status: tx.status,
      statusLabel: statusLabel(tx.status),
      createdAt: tx.createdAt.toISOString(),
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      bankName: p.bankName,
      status: p.status,
      statusLabel: payoutStatusLabel(p.status),
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
