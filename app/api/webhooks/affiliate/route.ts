import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { getMembershipStatus } from "@/lib/membership";

/**
 * Inbound postback endpoint for the affiliate network. Point AccessTrade's postback URL
 * (or your chosen network's equivalent) at:
 *   POST https://<your-domain>/api/webhooks/affiliate
 *
 * The mock provider never calls this endpoint — it simulates conversions internally via
 * `lib/affiliate/mock.ts` so the full flow can be demoed without any external network.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const provider = getAffiliateProvider();
  const conversion = provider.parseConversionPayload(body);

  if (!conversion) {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
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

  // Split the raw affiliate commission according to the user's current membership tier.
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
