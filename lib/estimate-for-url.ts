import { detectShopForUrl, LINK_ERROR_MESSAGES } from "@/lib/create-affiliate-link";
import { getMembershipStatus } from "@/lib/membership";
import {
  buildEstimate,
  NEW_MEMBER_SHARE,
  NEW_MEMBER_TIER_LABEL,
  type CashbackEstimate,
} from "@/lib/cashback-rate";

export type EstimateForUrlResult =
  | { ok: true; estimate: CashbackEstimate }
  | { ok: false; error: string };

/**
 * Read-only "how much would I get back?" lookup for a pasted URL. Creates no Click and no
 * affiliate link, so it is safe to expose without login — it lets a visitor see the value in
 * VND BEFORE being asked to register. Uses the visitor's own tier when they are signed in,
 * otherwise the new-member rate (the rate they would actually get after signing up).
 */
export async function estimateForUrl(rawUrl: string, userId?: string): Promise<EstimateForUrlResult> {
  const detected = await detectShopForUrl(rawUrl);
  if (!detected.ok) return { ok: false, error: LINK_ERROR_MESSAGES[detected.error] };

  if (userId) {
    const membership = await getMembershipStatus(userId);
    return { ok: true, estimate: buildEstimate(detected.shop, membership.shareRate, membership.label) };
  }
  return {
    ok: true,
    estimate: buildEstimate(detected.shop, NEW_MEMBER_SHARE, NEW_MEMBER_TIER_LABEL),
  };
}
