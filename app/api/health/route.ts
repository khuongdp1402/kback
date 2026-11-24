import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAffiliateProvider } from "@/lib/affiliate";
import { getPayoutProvider } from "@/lib/payout";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      latencyMs: Date.now() - startedAt,
      providers: {
        affiliate: getAffiliateProvider().name,
        payout: getPayoutProvider().name,
        storage: getStorageProvider().name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] Database check failed:", err);
    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
