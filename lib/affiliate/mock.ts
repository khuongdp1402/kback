import { prisma } from "@/lib/prisma";
import { getMembershipStatus } from "@/lib/membership";
import type {
  AffiliateProvider,
  ConversionPayload,
  CreateDeepLinkInput,
  CreateDeepLinkResult,
} from "./types";

/**
 * Simulated affiliate network used when no real provider credentials are configured.
 *
 * `createDeepLink` returns an internal "demo checkout" URL instead of redirecting to the real
 * merchant. After a short delay it schedules a fake conversion (via setTimeout, best-effort —
 * good enough for local demos) so the rest of the app (transactions, wallet, payouts) can be
 * exercised end-to-end without any external network calls.
 */
export class MockAffiliateProvider implements AffiliateProvider {
  readonly name = "mock";

  async createDeepLink(input: CreateDeepLinkInput): Promise<CreateDeepLinkResult> {
    const trackedUrl = `/demo-checkout?target=${encodeURIComponent(input.targetUrl)}&sub=${input.subId}`;

    // Fire-and-forget simulation of the merchant confirming an order some time later.
    void this.scheduleFakeConversion(input.subId);

    return { trackedUrl, providerClickId: `mock_${input.subId}` };
  }

  parseConversionPayload(raw: unknown): ConversionPayload | null {
    if (!raw || typeof raw !== "object") return null;
    const body = raw as Partial<ConversionPayload>;
    if (!body.subId || !body.externalOrderId) return null;
    return {
      subId: body.subId,
      externalOrderId: body.externalOrderId,
      orderAmount: body.orderAmount ?? 0,
      commissionAmount: body.commissionAmount ?? 0,
      status: body.status ?? "PENDING",
    };
  }

  private async scheduleFakeConversion(subId: string) {
    // Simulated delay before the "merchant" reports the order — short enough to demo live.
    const delayMs = 8_000 + Math.floor(Math.random() * 12_000);

    setTimeout(async () => {
      try {
        const click = await prisma.click.findUnique({
          where: { trackingId: subId },
          include: { shop: true },
        });
        if (!click) return;

        const existing = await prisma.transaction.findUnique({ where: { clickId: click.id } });
        if (existing) return;

        const orderAmount = randomOrderAmount();
        const baseCashbackAmount = round2((orderAmount * click.shop.cashbackRate) / 100);

        // Split the raw affiliate commission according to the user's current membership tier.
        const membership = await getMembershipStatus(click.userId);
        const cashbackAmount = round2(baseCashbackAmount * membership.shareRate);

        await prisma.transaction.create({
          data: {
            userId: click.userId,
            shopId: click.shopId,
            clickId: click.id,
            orderAmount,
            baseCashbackAmount,
            cashbackAmount,
            memberTier: membership.tier,
            status: "PENDING",
            externalOrderId: `MOCK-${click.trackingId}`,
          },
        });

        // Simulate the merchant confirming the order a bit later.
        const confirmDelayMs = 15_000 + Math.floor(Math.random() * 15_000);
        setTimeout(async () => {
          try {
            await prisma.transaction.updateMany({
              where: { clickId: click.id, status: "PENDING" },
              data: { status: "CONFIRMED", confirmedAt: new Date() },
            });
          } catch {
            // Best-effort demo simulation; ignore failures (e.g. dev server restarted).
          }
        }, confirmDelayMs);
      } catch {
        // Best-effort demo simulation; ignore failures (e.g. dev server restarted).
      }
    }, delayMs);
  }
}

function randomOrderAmount() {
  // Random plausible order value between 100,000 and 3,000,000 VND.
  return Math.round((100_000 + Math.random() * 2_900_000) / 1000) * 1000;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
