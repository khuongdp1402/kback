import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { detectNetworkFromUrl, UnrecognizedLinkError } from "@/lib/link-detect";

export type CreateAffiliateLinkResult =
  | { ok: true; trackedUrl: string; shopName: string; shopEmoji: string }
  | { ok: false; error: "unrecognized" | "shop_not_configured" };

/**
 * Shared "paste a product URL, get an affiliate link" flow used by both the web paste-link
 * form (app/api/affiliate/paste-link) and the Telegram bot — detects the marketplace, records
 * the Click against the given userId, and creates a tracked deep link for it.
 */
export async function createAffiliateLinkForUser(
  userId: string,
  rawUrl: string,
): Promise<CreateAffiliateLinkResult> {
  let detected;
  try {
    detected = await detectNetworkFromUrl(rawUrl);
  } catch (err) {
    if (err instanceof UnrecognizedLinkError) {
      return { ok: false, error: "unrecognized" };
    }
    throw err;
  }

  const shop = await prisma.shop.findFirst({ where: { network: detected.network } });
  if (!shop) {
    return { ok: false, error: "shop_not_configured" };
  }

  const trackingId = randomUUID();
  const provider = getAffiliateProvider();

  const { trackedUrl } = await provider.createDeepLink({
    targetUrl: detected.normalizedUrl,
    subId: trackingId,
    campaignId: shop.accessTradeCampaignId ?? undefined,
  });

  await prisma.click.create({
    data: {
      userId,
      shopId: shop.id,
      trackingId,
      targetUrl: detected.normalizedUrl,
      sourceUrl: rawUrl,
    },
  });

  return { ok: true, trackedUrl, shopName: shop.name, shopEmoji: shop.logoEmoji };
}
