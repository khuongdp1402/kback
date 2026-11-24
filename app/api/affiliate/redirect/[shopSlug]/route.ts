import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { shopSlug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) {
    return NextResponse.json({ error: "Không tìm thấy shop" }, { status: 404 });
  }

  const trackingId = randomUUID();
  const provider = getAffiliateProvider();

  let trackedUrl: string;
  try {
    const result = await provider.createDeepLink({
      targetUrl: shop.baseUrl,
      subId: trackingId,
      campaignId: shop.accessTradeCampaignId ?? undefined,
    });
    trackedUrl = result.trackedUrl;
  } catch (err) {
    console.error(`[affiliate redirect] createDeepLink failed for ${shop.slug}:`, err);
    const fallbackUrl = new URL("/shops", request.url);
    fallbackUrl.searchParams.set("error", "link_unavailable");
    fallbackUrl.searchParams.set("shop", shop.name);
    return NextResponse.redirect(fallbackUrl);
  }

  await prisma.click.create({
    data: {
      userId: session.user.id,
      shopId: shop.id,
      trackingId,
      targetUrl: shop.baseUrl,
    },
  });

  const destination = trackedUrl.startsWith("/")
    ? new URL(trackedUrl, request.url)
    : trackedUrl;

  return NextResponse.redirect(destination);
}
