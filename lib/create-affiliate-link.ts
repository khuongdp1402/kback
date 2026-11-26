import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { detectNetworkFromUrl, UnrecognizedLinkError } from "@/lib/link-detect";
import { getMembershipStatus } from "@/lib/membership";
import { buildEstimate, type CashbackEstimate } from "@/lib/cashback-rate";

export type CreateAffiliateLinkResult =
  | {
      ok: true;
      trackedUrl: string;
      shopName: string;
      shopEmoji: string;
      estimate: CashbackEstimate;
    }
  | { ok: false; error: "unrecognized" | "shop_not_configured" };

export type DetectShopResult =
  | {
      ok: true;
      shop: NonNullable<Awaited<ReturnType<typeof prisma.shop.findFirst>>>;
      normalizedUrl: string;
    }
  | { ok: false; error: "unrecognized" | "shop_not_configured" };

/** Detects the marketplace of a pasted URL and loads the matching Shop — no side effects. */
export async function detectShopForUrl(rawUrl: string): Promise<DetectShopResult> {
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
  return { ok: true, shop, normalizedUrl: detected.normalizedUrl };
}

export const LINK_ERROR_MESSAGES: Record<"unrecognized" | "shop_not_configured", string> = {
  unrecognized:
    "Chưa hỗ trợ sàn này. Hiện chỉ nhận link từ Shopee, Lazada, Tiki, TikTok Shop và ShopeeFood.",
  shop_not_configured: "Sàn này tạm thời chưa nhận hoàn tiền. Vui lòng thử lại sau.",
};

/**
 * Shared "paste a product URL, get an affiliate link" flow used by the web paste-link form
 * (app/api/affiliate/paste-link), the Telegram bot and the Zalo Mini App — detects the
 * marketplace, records the Click against the given userId, creates a tracked deep link for it,
 * and returns an honest cashback estimate at the user's current membership tier.
 */
export async function createAffiliateLinkForUser(
  userId: string,
  rawUrl: string,
): Promise<CreateAffiliateLinkResult> {
  const detected = await detectShopForUrl(rawUrl);
  if (!detected.ok) return detected;
  const { shop, normalizedUrl } = detected;

  const trackingId = randomUUID();
  const provider = getAffiliateProvider();

  const [{ trackedUrl }, membership] = await Promise.all([
    provider.createDeepLink({
      targetUrl: normalizedUrl,
      subId: trackingId,
      campaignId: shop.accessTradeCampaignId ?? undefined,
    }),
    getMembershipStatus(userId),
  ]);

  await prisma.click.create({
    data: {
      userId,
      shopId: shop.id,
      trackingId,
      targetUrl: normalizedUrl,
      sourceUrl: rawUrl,
    },
  });

  return {
    ok: true,
    trackedUrl,
    shopName: shop.name,
    shopEmoji: shop.logoEmoji,
    estimate: buildEstimate(shop, membership.shareRate, membership.label),
  };
}
