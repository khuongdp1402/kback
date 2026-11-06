import { prisma } from "@/lib/prisma";
import type { CreatePayoutInput, CreatePayoutResult, PayoutProvider, PayoutState } from "./types";

/**
 * Simulated payout provider used when no real bank transfer credentials are configured.
 * Immediately marks the request as PROCESSING, then flips it to PAID after a short delay so
 * the wallet/payout history UI can be exercised end-to-end without a real banking integration.
 */
export class MockPayoutProvider implements PayoutProvider {
  readonly name = "mock";
  private readonly states = new Map<string, PayoutState>();

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult> {
    const providerRef = `mock_payout_${input.payoutRequestId}`;
    this.states.set(providerRef, "PROCESSING");

    const delayMs = 10_000 + Math.floor(Math.random() * 10_000);
    setTimeout(async () => {
      this.states.set(providerRef, "PAID");
      try {
        await prisma.payoutRequest.update({
          where: { id: input.payoutRequestId },
          data: { status: "PAID" },
        });
      } catch {
        // Best-effort demo simulation; ignore failures (e.g. dev server restarted).
      }
    }, delayMs);

    return { providerRef, state: "PROCESSING" };
  }

  async checkPayoutStatus(providerRef: string): Promise<PayoutState> {
    return this.states.get(providerRef) ?? "PENDING";
  }
}
