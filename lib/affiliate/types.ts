/**
 * Affiliate network abstraction.
 *
 * Real e-commerce marketplaces (Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood) do not expose
 * a public affiliate API directly to third-party apps. In practice, Vietnamese cashback apps
 * integrate through an intermediary affiliate network (most commonly AccessTrade) that offers:
 *   - a Deep Link API to turn any product/shop URL into a tracked link across many merchants, and
 *   - a Postback/Conversion API that notifies the publisher when an order is confirmed and a
 *     commission is payable.
 *
 * `AffiliateProvider` models that shared shape so a real network can be dropped in behind the
 * same interface the rest of the app already uses.
 */

export interface CreateDeepLinkInput {
  /** Destination URL on the merchant's site (product page, category, or shop homepage). */
  targetUrl: string;
  /** Internal id used to reconcile the eventual conversion postback with our own Click record. */
  subId: string;
  /**
   * Network-specific campaign identifier for the merchant (e.g. AccessTrade's campaign_id).
   * Each merchant/network is a separate campaign on AccessTrade — required for real deep link
   * calls, ignored by the mock provider.
   */
  campaignId?: string;
}

export interface CreateDeepLinkResult {
  /** The tracked URL the user should be redirected to. */
  trackedUrl: string;
  /** Provider-side identifier for this link/click, if any. */
  providerClickId?: string;
}

export type ConversionStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface ConversionPayload {
  /** Matches the subId passed to createDeepLink, used to find our Click. */
  subId: string;
  /** Provider's own order/transaction id. */
  externalOrderId: string;
  orderAmount: number;
  commissionAmount: number;
  status: ConversionStatus;
}

export interface AffiliateProvider {
  /** Human-readable id, e.g. "mock" or "accesstrade". */
  readonly name: string;
  /** Build a tracked outbound link for a given merchant URL. */
  createDeepLink(input: CreateDeepLinkInput): Promise<CreateDeepLinkResult>;
  /** Parse an inbound postback/webhook request body into a normalized conversion payload. */
  parseConversionPayload(raw: unknown): ConversionPayload | null;
}
