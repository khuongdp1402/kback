import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { getMembershipStatus } from "@/lib/membership";

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyAffiliateWebhookAuth(request: Request, providerName: string): boolean {
  const expectedSecret = process.env.AFFILIATE_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) {
    // Allow unauthenticated calls only in non-production or mock mode for local development.
    return process.env.NODE_ENV !== "production" || providerName === "mock";
  }

  const headerSecret = request.headers.get("x-webhook-secret")?.trim();
  if (headerSecret && safeEquals(headerSecret, expectedSecret)) return true;

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token && safeEquals(token, expectedSecret)) return true;
  }

  const querySecret = new URL(request.url).searchParams.get("secret")?.trim();
  if (querySecret && safeEquals(querySecret, expectedSecret)) return true;

  return false;
}

/**
 * Inbound postback endpoint for the affiliate network. Point AccessTrade's postback URL
 * (or your chosen network's equivalent) at:
 *   POST https://<your-domain>/api/webhooks/affiliate?secret=<AFFILIATE_WEBHOOK_SECRET>
 * or send header `X-Webhook-Secret: <AFFILIATE_WEBHOOK_SECRET>`.
 */
export async function POST(request: Request) {
  const provider = getAffiliateProvider();

  if (!verifyAffiliateWebhookAuth(request, provider.name)) {
    return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const conversion = provider.parseConversionPayload(body);

  if (!conversion) {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
  }

  if (conversion.orderAmount < 0 || conversion.commissionAmount < 0) {
    return NextResponse.json({ error: "Giá trị giao dịch không hợp lệ" }, { status: 400 });
  }

  const click = await prisma.click.findUnique({ where: { trackingId: conversion.subId } });
  if (!click) {
    return NextResponse.json({ error: "Không tìm thấy click tương ứng" }, { status: 404 });
  }

  const status =
    conversion.status === "CONFIRMED"
      ? "CONFIRMED"
      : conversion.status === "REJECTED"
        ? "REJECTED"
        : "PENDING";

  const membership = await getMembershipStatus(click.userId);
  const baseCashbackAmount = conversion.commissionAmount;
  const cashbackAmount = Math.round(baseCashbackAmount * membership.shareRate * 100) / 100;

  await prisma.transaction.upsert({
    where: { clickId: click.id },
    create: {
      userId: click.userId,
      shopId: click.shopId,
      clickId: click.id,
      orderAmount: conversion.orderAmount,
      baseCashbackAmount,
      cashbackAmount,
      memberTier: membership.tier,
      status,
      externalOrderId: conversion.externalOrderId,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
    update: {
      orderAmount: conversion.orderAmount,
      baseCashbackAmount,
      cashbackAmount,
      status,
      externalOrderId: conversion.externalOrderId,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
