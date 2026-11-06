import { AccessTradeProvider } from "./accesstrade";
import { ShopeeDirectProvider } from "./shopee-direct";
import { MockAffiliateProvider } from "./mock";
import type { AffiliateProvider } from "./types";

export type { AffiliateProvider, ConversionPayload, ConversionStatus } from "./types";

let cached: AffiliateProvider | null = null;

/**
 * Resolves the active AffiliateProvider from environment configuration.
 * Falls back to the mock provider whenever real credentials are missing, so the app
 * always runs end-to-end locally without requiring any external account.
 *
 * SAFETY GUARD: real providers additionally require LEGAL_COMPLIANCE_CONFIRMED=true. This
 * prevents accidentally going live with a real affiliate network before completing the
 * compliance checklist in README.md § "Pháp lý & tuân thủ" (business registration, registering
 * as a publisher through the network rather than a personal account, e-commerce site
 * notification with the Ministry of Industry and Trade). Flip it only after that checklist is
 * actually done — not as a way to silence this guard.
 */
export function getAffiliateProvider(): AffiliateProvider {
  if (cached) return cached;

  const kind = process.env.AFFILIATE_PROVIDER ?? "mock";
  const complianceConfirmed = process.env.LEGAL_COMPLIANCE_CONFIRMED === "true";

  if (kind === "accesstrade") {
    const apiKey = process.env.ACCESSTRADE_API_KEY ?? "";
    const baseUrl = process.env.ACCESSTRADE_API_BASE_URL ?? "https://api.accesstrade.vn";
    if (apiKey && complianceConfirmed) {
      cached = new AccessTradeProvider(apiKey, baseUrl);
      return cached;
    }
    if (apiKey && !complianceConfirmed) {
      console.warn(
        "[affiliate] AFFILIATE_PROVIDER=accesstrade nhưng LEGAL_COMPLIANCE_CONFIRMED chưa " +
          "được bật — dùng MockAffiliateProvider để tránh gọi API thật trước khi hoàn tất " +
          "đăng ký pháp lý. Xem README.md § \"Pháp lý & tuân thủ\".",
      );
    }
  } else if (kind === "shopee_direct") {
    const appId = process.env.SHOPEE_AFFILIATE_APP_ID ?? "";
    const secret = process.env.SHOPEE_AFFILIATE_SECRET ?? "";
    const baseUrl =
      process.env.SHOPEE_AFFILIATE_API_BASE_URL ?? "https://open-api.affiliate.shopee.vn";
    if (appId && secret && complianceConfirmed) {
      cached = new ShopeeDirectProvider(appId, secret, baseUrl);
      return cached;
    }
    if (appId && secret && !complianceConfirmed) {
      console.warn(
        "[affiliate] AFFILIATE_PROVIDER=shopee_direct nhưng LEGAL_COMPLIANCE_CONFIRMED chưa " +
          "được bật — dùng MockAffiliateProvider để tránh gọi API thật trước khi hoàn tất " +
          "đăng ký pháp lý. Xem README.md § \"Pháp lý & tuân thủ\".",
      );
    }
  }

  cached = new MockAffiliateProvider();
  return cached;
}
