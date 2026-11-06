import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";

/**
 * Creates (or re-creates) the static affiliate link for a Product. Unlike the pure string-only
 * deep link this started as, it now creates a real Click row (attributed to the admin who
 * triggered it) so the link flows through the existing AccessTrade postback pipeline
 * (app/api/webhooks/affiliate) exactly like the user-facing "paste a link" flow — giving
 * product links real click/conversion tracking once AFFILIATE_PROVIDER=accesstrade is live,
 * instead of being a dead-end string nobody can attribute traffic to.
 *
 * Regenerating (e.g. after editing sourceUrl) creates a NEW Click rather than reusing the old
 * one, so historical tracking data for the previous link isn't silently overwritten — old
 * Clicks just stop being referenced by Product.clickId but remain in the table.
 */
export async function createProductAffiliateLink(
  productId: string,
  createdByUserId: string,
): Promise<{ ok: true; trackedUrl: string } | { ok: false; error: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { shop: true },
  });
  if (!product) return { ok: false, error: "Không tìm thấy sản phẩm" };

  const trackingId = randomUUID();
  const provider = getAffiliateProvider();

  let trackedUrl: string;
  try {
    const result = await provider.createDeepLink({
      targetUrl: product.sourceUrl,
      subId: trackingId,
      campaignId: product.shop.accessTradeCampaignId ?? undefined,
    });
    trackedUrl = result.trackedUrl;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Tạo deep link thất bại" };
  }

  const click = await prisma.click.create({
    data: {
      userId: createdByUserId,
      shopId: product.shopId,
      trackingId,
      targetUrl: product.sourceUrl,
      sourceUrl: product.sourceUrl,
    },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { affiliateDeepLink: trackedUrl, clickId: click.id, createdByUserId },
  });

  return { ok: true, trackedUrl };
}
