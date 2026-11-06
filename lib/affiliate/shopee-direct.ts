import { createHash } from "crypto";
import type {
  AffiliateProvider,
  ConversionPayload,
  CreateDeepLinkInput,
  CreateDeepLinkResult,
} from "./types";

/**
 * Real Shopee Affiliate Open API integration — Shopee's OWN affiliate program
 * (affiliate.shopee.vn), separate from going through AccessTrade's Shopee campaign. Useful as a
 * fallback while AccessTrade has Shopee publisher approvals paused (rolling review as of
 * 2026-05-26, no fixed end date) — this bypasses that entirely since it talks to Shopee directly.
 *
 * API shape (Vietnam endpoint):
 *   POST https://open-api.affiliate.shopee.vn/graphql
 *   Content-Type: application/json
 *   Authorization: SHA256 Credential={appId}, Timestamp={unixSeconds}, Signature={signature}
 *     where signature = SHA256(appId + "\n" + timestamp + "\n" + rawJsonBody + "\n" + secret)
 *     (exact concatenation order/format to be confirmed against the API Explorer — see below —
 *     before going live; different Shopee affiliate regions have shown minor variations)
 *
 *   Mutation to create a tracked link:
 *     mutation { generateShortLink(input: { originUrl: "...", subIds: ["..."] }) { shortLink } }
 *
 *   Conversion data comes from the Conversion/Validated Report queries (polling), not a pushed
 *   webhook — Shopee does not call our server the way AccessTrade's postback does. A real
 *   integration needs a scheduled job (cron) that periodically queries conversions by subId and
 *   reconciles them against pending Transactions — parseConversionPayload here is written for
 *   that reconciliation step, given one report row at a time.
 *
 * Getting credentials: register at https://affiliate.shopee.vn (any Shopee account + one
 * distribution channel, e.g. this website — no minimum follower count found in Shopee's public
 * terms), then find App ID / Secret under the "Open API" section of the affiliate dashboard.
 * Verify the exact request-signing format against the live API Explorer at
 * https://open-api.affiliate.shopee.vn/explorer/v2 before enabling this in production — the
 * signing scheme above is reconstructed from Shopee's other regional affiliate APIs (confirmed
 * pattern: Credential/Timestamp/Signature header, SHA256 over appId+timestamp+payload+secret)
 * and has not yet been verified against a real Vietnam account.
 *
 * Activate by setting AFFILIATE_PROVIDER=shopee_direct, SHOPEE_AFFILIATE_APP_ID,
 * SHOPEE_AFFILIATE_SECRET, and LEGAL_COMPLIANCE_CONFIRMED=true. Falls back to
 * MockAffiliateProvider otherwise (see lib/affiliate/index.ts).
 */
export class ShopeeDirectProvider implements AffiliateProvider {
  readonly name = "shopee_direct";

  constructor(
    private readonly appId: string,
    private readonly secret: string,
    private readonly baseUrl: string,
  ) {}

  private sign(payload: string, timestamp: number): string {
    const raw = `${this.appId}${timestamp}${payload}${this.secret}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const body = JSON.stringify({ query, variables });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.sign(body, timestamp);

    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `SHA256 Credential=${this.appId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      body,
    });

    const json = (await response.json().catch(() => null)) as {
      data?: T;
      errors?: { message: string }[];
    } | null;

    if (!response.ok || json?.errors?.length) {
      throw new Error(
        `Shopee Affiliate API request failed: ${response.status} ${JSON.stringify(json?.errors ?? json)}`,
      );
    }
    if (!json?.data) {
      throw new Error("Shopee Affiliate API returned no data");
    }
    return json.data;
  }

  async createDeepLink(input: CreateDeepLinkInput): Promise<CreateDeepLinkResult> {
    const query = `
      mutation GenerateShortLink($originUrl: String!, $subIds: [String!]) {
        generateShortLink(input: { originUrl: $originUrl, subIds: $subIds }) {
          shortLink
        }
      }
    `;

    const data = await this.graphql<{ generateShortLink?: { shortLink?: string } }>(query, {
      originUrl: input.targetUrl,
      subIds: [input.subId],
    });

    const shortLink = data.generateShortLink?.shortLink;
    if (!shortLink) {
      throw new Error("Shopee Affiliate API: generateShortLink returned no shortLink");
    }

    return { trackedUrl: shortLink };
  }

  /**
   * Shopee doesn't push conversions to us — this parses one row from a Conversion Report API
   * poll (see lib/affiliate/shopee-direct-sync.ts, not yet implemented) into our normalized
   * shape, keyed by the subId we set in createDeepLink. Kept here so the same
   * webhook-shaped-payload contract works for both push (AccessTrade) and pull (Shopee) sources
   * once a polling job exists.
   */
  parseConversionPayload(raw: unknown): ConversionPayload | null {
    if (!raw || typeof raw !== "object") return null;
    const row = raw as Record<string, unknown>;

    const subId = row.subId ?? row.sub_id;
    const externalOrderId = row.orderId ?? row.order_id ?? row.conversionId;
    const orderAmount = Number(row.orderAmount ?? row.order_amount ?? 0);
    const commissionAmount = Number(row.commission ?? row.netCommission ?? row.net_commission ?? 0);
    const rawStatus = String(row.status ?? row.conversionStatus ?? "").toLowerCase();

    if (typeof subId !== "string" || typeof externalOrderId !== "string") return null;

    const status =
      rawStatus === "valid" || rawStatus === "confirmed" || rawStatus === "completed"
        ? "CONFIRMED"
        : rawStatus === "invalid" || rawStatus === "rejected" || rawStatus === "cancelled"
          ? "REJECTED"
          : "PENDING";

    return { subId, externalOrderId, orderAmount, commissionAmount, status };
  }
}
