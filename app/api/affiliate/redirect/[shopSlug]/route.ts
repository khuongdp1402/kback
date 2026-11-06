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

  const { trackedUrl } = await provider.createDeepLink({
    targetUrl: shop.baseUrl,
    subId: trackingId,
    campaignId: shop.accessTradeCampaignId ?? undefined,
  });

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
