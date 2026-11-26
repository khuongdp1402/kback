import { prisma } from "@/lib/prisma";

export type MembershipTier = "MEMBER" | "SILVER" | "GOLD";

/**
 * Membership tiers split the raw affiliate commission with the user. Higher tiers (reached by
 * accumulating more confirmed order spend over time) keep a larger share of the commission.
 *
 * COMPLIANCE BOUNDARY — do not cross this without legal review:
 * Vietnam's Ministry of Industry and Trade has publicly warned that cashback apps with tier/level
 * structures can be mistaken for illegal multi-level marketing (Decree 40/2018/NĐ-CP; Article
 * 217a of the Penal Code — up to 5 billion VND or 5 years in prison). The line that keeps this
 * legal (same model as ShopBack, which operates legally in Vietnam):
 *   - Tier is derived ONLY from the user's own confirmed order spend (see getMembershipStatus).
 *   - There is NO referral/invite mechanism and NO commission earned from another user's orders.
 * If a future change introduces referral bonuses, sign-up rewards, or rewards for recruiting
 * other users, get legal review first — that is exactly the pattern regulators flagged.
 */
export const TIERS: {
  tier: MembershipTier;
  label: string;
  /** Minimum lifetime confirmed order spend (VND) required to reach this tier. */
  minSpend: number;
  /** Share of the affiliate network's raw commission credited to the user, e.g. 0.5 = 50%. */
  shareRate: number;
}[] = [
  // Business split: the user keeps most of the commission (e.g. network pays 10% → user 7%,
  // KBack 3% at the base tier). Tiers only add a small bonus so KBack always keeps ≥ 20%.
  { tier: "MEMBER", label: "Thành viên", minSpend: 0, shareRate: 0.7 },
  { tier: "SILVER", label: "Bạc", minSpend: 5_000_000, shareRate: 0.75 },
  { tier: "GOLD", label: "Vàng", minSpend: 20_000_000, shareRate: 0.8 },
];

export function tierInfo(tier: MembershipTier) {
  return TIERS.find((t) => t.tier === tier) ?? TIERS[0];
}

export function tierForSpend(totalSpend: number): (typeof TIERS)[number] {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (totalSpend >= t.minSpend) current = t;
  }
  return current;
}

export function nextTier(tier: MembershipTier) {
  const idx = TIERS.findIndex((t) => t.tier === tier);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/**
 * A user's tier is derived from their lifetime confirmed order spend, not stored directly —
 * consistent with how the wallet balance is derived rather than cached.
 */
export async function getMembershipStatus(userId: string) {
  const result = await prisma.transaction.aggregate({
    where: { userId, status: "CONFIRMED" },
    _sum: { orderAmount: true },
  });

  const totalSpend = result._sum.orderAmount ?? 0;
  const current = tierForSpend(totalSpend);
  const next = nextTier(current.tier);

  return {
    tier: current.tier,
    label: current.label,
    shareRate: current.shareRate,
    totalSpend,
    next,
    amountToNextTier: next ? Math.max(0, next.minSpend - totalSpend) : 0,
  };
}
