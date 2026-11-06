/**
 * Payout provider abstraction — moves the approved wallet balance to the user's bank account.
 * Mirrors the same adapter pattern as `lib/affiliate`: a mock implementation runs by default,
 * a real bank-transfer implementation (VietQR-style) can be dropped in via environment config.
 */

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CreatePayoutInput {
  payoutRequestId: string;
  amount: number;
  bankInfo: BankInfo;
}

export type PayoutState = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export interface CreatePayoutResult {
  providerRef: string;
  state: PayoutState;
}

export interface PayoutProvider {
  readonly name: string;
  createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult>;
  checkPayoutStatus(providerRef: string): Promise<PayoutState>;
}
