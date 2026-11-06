import type {
  AffiliateProvider,
  ConversionPayload,
  CreateDeepLinkInput,
  CreateDeepLinkResult,
} from "./types";

/**
 * Real AccessTrade integration.
 *
 * Deep Link API — creates a tracked link for a merchant URL:
 *   POST {ACCESSTRADE_API_BASE_URL}/v1/product_link/create
 *   Headers: Authorization: Token <ACCESSTRADE_API_KEY>   (note: "Token <key>", not "Token token=<key>")
 *   Body: { campaign_id, urls: [targetUrl], utm_source, utm_medium, sub1 }
 *   campaign_id is REQUIRED and is per-merchant — each shop (Shopee, Tiki, TikTok Shop, ...) is
 *   a separate "campaign" on AccessTrade with its own id, found on the campaign's detail page
 *   URL (pub2.accesstrade.vn/campaign-v2/<name>--<campaign_id>) or via their campaign list API.
 *   Store it on Shop.accessTradeCampaignId (managed from /admin/shops).
 *   Response shape: { success: true, data: { success_link: [{ aff_link, short_link, ... }], ... } }
 *   Docs: https://developers.accesstrade.vn/api-publisher-vietnamese/tao-tracking-link
 *
 * Postback — AccessTrade calls our webhook (or we poll their conversion API) with the
 * transaction's status once an order is confirmed/rejected by the merchant. The postback
 * carries the `sub1` we sent back to us so we can reconcile it with our own Click record.
 *   Docs: https://support.accesstrade.global/system-integration/what-is-postback-and-how-to-use.html
 *
 * This class is wired to the real API contract verified against AccessTrade's live endpoint.
 * Fill in ACCESSTRADE_API_KEY in .env, set each Shop's accessTradeCampaignId, and set
 * AFFILIATE_PROVIDER=accesstrade + LEGAL_COMPLIANCE_CONFIRMED=true to activate it. Until then,
 * `lib/affiliate/index.ts` falls back to MockAffiliateProvider automatically.
 */
export class AccessTradeProvider implements AffiliateProvider {
  readonly name = "accesstrade";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  async createDeepLink(input: CreateDeepLinkInput): Promise<CreateDeepLinkResult> {
    if (!input.campaignId) {
      throw new Error(
        `AccessTrade: missing campaign_id for shop — set Shop.accessTradeCampaignId in /admin/shops before this shop can create real affiliate links.`,
      );
    }

    const response = await fetch(`${this.baseUrl}/v1/product_link/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        campaign_id: input.campaignId,
        urls: [input.targetUrl],
        utm_source: "kback",
        utm_medium: "affiliate",
        sub1: input.subId,
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: unknown;
      data?: {
        success_link?: { aff_link: string; short_link?: string; url_origin?: string }[];
        error_link?: unknown[];
      };
    } | null;

    if (!response.ok || !body?.success) {
      throw new Error(
        `AccessTrade deep link request failed: ${response.status} ${JSON.stringify(body?.message ?? body)}`,
      );
    }

    const link = body.data?.success_link?.[0];
    if (!link) {
      throw new Error(
        `AccessTrade deep link request returned no link: ${JSON.stringify(body.data?.error_link)}`,
      );
    }

    return { trackedUrl: link.short_link ?? link.aff_link };
  }

  parseConversionPayload(raw: unknown): ConversionPayload | null {
    if (!raw || typeof raw !== "object") return null;
    const body = raw as Record<string, unknown>;

    const subId = body.sub1 ?? body.sub_id ?? body.subId;
    const externalOrderId = body.transaction_id ?? body.order_id ?? body.click_id;
    const orderAmount = Number(body.order_value ?? body.sale_amount ?? 0);
    const commissionAmount = Number(body.pub_commission ?? body.commission ?? 0);
    const rawStatus = String(body.status ?? body.conversion_status ?? "").toLowerCase();

    if (typeof subId !== "string" || typeof externalOrderId !== "string") return null;

    const status =
      rawStatus === "approved" || rawStatus === "confirmed"
        ? "CONFIRMED"
        : rawStatus === "rejected" || rawStatus === "cancelled"
          ? "REJECTED"
          : "PENDING";

    return { subId, externalOrderId, orderAmount, commissionAmount, status };
  }
}
