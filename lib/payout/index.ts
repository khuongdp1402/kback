import { MockPayoutProvider } from "./mock";
import { VietQRPayoutProvider } from "./vietqr";
import type { PayoutProvider } from "./types";

export type { PayoutProvider, BankInfo, PayoutState } from "./types";

let cached: PayoutProvider | null = null;

/**
 * Resolves the active PayoutProvider from environment configuration.
 * Falls back to the mock provider whenever real credentials are missing.
 *
 * SAFETY GUARD: real providers additionally require LEGAL_COMPLIANCE_CONFIRMED=true — see the
 * matching guard in lib/affiliate/index.ts. Don't move real money before the compliance
 * checklist in README.md § "Pháp lý & tuân thủ" is actually done.
 */
export function getPayoutProvider(): PayoutProvider {
  if (cached) return cached;

  const kind = process.env.PAYOUT_PROVIDER ?? "mock";
  const clientId = process.env.VIETQR_CLIENT_ID ?? "";
  const apiKey = process.env.VIETQR_API_KEY ?? "";
  const baseUrl = process.env.VIETQR_API_BASE_URL ?? "https://api.vietqr.io";
  const complianceConfirmed = process.env.LEGAL_COMPLIANCE_CONFIRMED === "true";

  if (kind === "vietqr" && clientId && apiKey && complianceConfirmed) {
    cached = new VietQRPayoutProvider(clientId, apiKey, baseUrl);
  } else {
    if (kind === "vietqr" && clientId && apiKey && !complianceConfirmed) {
      console.warn(
        "[payout] PAYOUT_PROVIDER=vietqr nhưng LEGAL_COMPLIANCE_CONFIRMED chưa được bật — " +
          "dùng MockPayoutProvider để tránh chuyển tiền thật trước khi hoàn tất đăng ký pháp " +
          "lý. Xem README.md § \"Pháp lý & tuân thủ\".",
      );
    }
    cached = new MockPayoutProvider();
  }

  return cached;
}
