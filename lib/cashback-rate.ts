import type { ShopNetwork } from "@/app/generated/prisma/enums";
import { TIERS, tierInfo, type MembershipTier } from "@/lib/membership";

/**
 * `Shop.cashbackRate` is the RAW commission % the affiliate network pays KBack — not what the
 * user receives. The user only gets `shareRate` of it (see lib/membership.ts). Every number
 * shown to a customer must go through this file so we never advertise the raw network rate as
 * "hoàn tới X%": a new member seeing 4.5% advertised and receiving 2.25% on their first order is
 * the fastest way to lose their trust (and risks being misleading advertising).
 */

const NEW_MEMBER_SHARE = TIERS[0].shareRate;
const TOP_SHARE = TIERS[TIERS.length - 1].shareRate;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Percent of the order value the user actually receives, e.g. 4.5% raw × 50% = 2.3%. */
export function userCashbackRate(baseRate: number, shareRate: number = NEW_MEMBER_SHARE) {
  return round1(baseRate * shareRate);
}

export function userCashbackRateForTier(baseRate: number, tier: MembershipTier) {
  return userCashbackRate(baseRate, tierInfo(tier).shareRate);
}

/** Rate a brand-new member gets ("từ X%") and the best rate at the top tier ("tới Y%"). */
export function publicRateRange(baseRate: number) {
  return { from: userCashbackRate(baseRate, NEW_MEMBER_SHARE), upTo: userCashbackRate(baseRate, TOP_SHARE) };
}

/** Estimated cashback in VND for an order value, rounded down to the nearest 100đ. */
export function estimateCashbackVnd(orderAmount: number, baseRate: number, shareRate: number) {
  const raw = (orderAmount * baseRate * shareRate) / 100;
  return Math.floor(raw / 100) * 100;
}

/**
 * Typical time for the network to confirm an order (return window + reconciliation). These are
 * conservative estimates from docs/affiliate-network-strategy.md — always tell users the honest
 * range up front, since a longer-than-promised wait reads as "the app didn't pay me".
 */
export const SETTLEMENT_DAYS: Record<ShopNetwork, { min: number; max: number }> = {
  SHOPEE: { min: 30, max: 60 },
  LAZADA: { min: 30, max: 60 },
  TIKI: { min: 30, max: 45 },
  TIKTOK: { min: 30, max: 60 },
  SHOPEEFOOD: { min: 7, max: 30 },
};

export function settlementLabel(network: ShopNetwork) {
  const { min, max } = SETTLEMENT_DAYS[network];
  return `${min}–${max} ngày`;
}

/** Sample order values used to show "đơn X → hoàn Y" examples. */
export const EXAMPLE_ORDER_AMOUNTS = [200_000, 500_000, 1_000_000];

export interface CashbackEstimate {
  shopName: string;
  shopEmoji: string;
  network: ShopNetwork;
  /** % of order value this user receives at their current tier. */
  userRate: number;
  /** % a top-tier member would receive — shown as the upgrade incentive. */
  topTierRate: number;
  tierLabel: string;
  settlement: string;
  examples: { orderAmount: number; cashback: number }[];
}

export function buildEstimate(
  shop: { name: string; logoEmoji: string; network: ShopNetwork; cashbackRate: number },
  shareRate: number,
  tierLabel: string,
): CashbackEstimate {
  return {
    shopName: shop.name,
    shopEmoji: shop.logoEmoji,
    network: shop.network,
    userRate: userCashbackRate(shop.cashbackRate, shareRate),
    topTierRate: userCashbackRate(shop.cashbackRate, TOP_SHARE),
    tierLabel,
    settlement: settlementLabel(shop.network),
    examples: EXAMPLE_ORDER_AMOUNTS.map((orderAmount) => ({
      orderAmount,
      cashback: estimateCashbackVnd(orderAmount, shop.cashbackRate, shareRate),
    })),
  };
}

export const NEW_MEMBER_TIER_LABEL = TIERS[0].label;
export { NEW_MEMBER_SHARE };
