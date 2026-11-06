import type { CreatePayoutInput, CreatePayoutResult, PayoutProvider, PayoutState } from "./types";

/**
 * Real bank payout integration, shaped after the common VietQR-style bank transfer API contract
 * (client id + api key auth, create transfer, poll status by reference). Vietnamese banking
 * payout APIs vary by provider/bank partner — this class is a ready-to-wire skeleton: fill in
 * VIETQR_CLIENT_ID / VIETQR_API_KEY in .env and set PAYOUT_PROVIDER=vietqr to activate it, then
 * adjust field names below to match the exact partner contract you sign up with.
 *
 * Until real credentials are set, `lib/payout/index.ts` falls back to MockPayoutProvider so
 * withdrawals keep working end-to-end in the demo.
 */
export class VietQRPayoutProvider implements PayoutProvider {
  readonly name = "vietqr";

  constructor(
    private readonly clientId: string,
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult> {
    const response = await fetch(`${this.baseUrl}/v1/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": this.clientId,
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        reference: input.payoutRequestId,
        amount: input.amount,
        bank_name: input.bankInfo.bankName,
        account_number: input.bankInfo.accountNumber,
        account_name: input.bankInfo.accountName,
      }),
    });

    if (!response.ok) {
      throw new Error(`VietQR payout request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { transfer_id?: string; status?: string };

    return {
      providerRef: data.transfer_id ?? input.payoutRequestId,
      state: normalizeState(data.status),
    };
  }

  async checkPayoutStatus(providerRef: string): Promise<PayoutState> {
    const response = await fetch(`${this.baseUrl}/v1/transfers/${providerRef}`, {
      headers: { "x-client-id": this.clientId, "x-api-key": this.apiKey },
    });
    if (!response.ok) return "PENDING";
    const data = (await response.json()) as { status?: string };
    return normalizeState(data.status);
  }
}

function normalizeState(status: string | undefined): PayoutState {
  switch (status) {
    case "processing":
      return "PROCESSING";
    case "success":
    case "paid":
      return "PAID";
    case "failed":
    case "error":
      return "FAILED";
    default:
      return "PENDING";
  }
}
