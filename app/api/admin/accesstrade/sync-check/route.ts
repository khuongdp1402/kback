import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

interface AccessTradeTransactionRow {
  transaction_id?: string;
  order_id?: string;
  click_id?: string;
  sub1?: string;
  sub_id?: string;
  order_value?: number;
  sale_amount?: number;
  pub_commission?: number;
  commission?: number;
  status?: string;
  conversion_status?: string;
  transaction_time?: string;
  utm_campaign?: string;
}

/**
 * Pulls real transactions from AccessTrade's Report API (GET /v1/transactions) for a date
 * range and reconciles them against our own Transaction records by matching AccessTrade's
 * `sub1` field to our Click.trackingId. Surfaces any AccessTrade transaction that has no
 * matching KBack Transaction yet — the signal an admin needs when the postback webhook
 * (/api/webhooks/affiliate) missed an update or hasn't been configured on AccessTrade's side.
 *
 * This is a manual reconciliation check, not a live sync — it doesn't write anything, just
 * reports discrepancies for a human to review from /admin/transactions.
 */
export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const apiKey = process.env.ACCESSTRADE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình ACCESSTRADE_API_KEY trong biến môi trường" },
      { status: 422 },
    );
  }

  const { searchParams } = new URL(request.url);
  const daysBack = Math.min(Number(searchParams.get("days") ?? 30), 90);
  const until = new Date();
  const since = new Date(until.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const baseUrl = process.env.ACCESSTRADE_API_BASE_URL ?? "https://api.accesstrade.vn";
  const query = new URLSearchParams({
    since: since.toISOString(),
    until: until.toISOString(),
    limit: "100",
  });

  const response = await fetch(`${baseUrl}/v1/transactions?${query}`, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  const body = (await response.json().catch(() => null)) as {
    total?: number;
    data?: AccessTradeTransactionRow[];
    message?: unknown;
  } | null;

  if (!response.ok) {
    return NextResponse.json(
      { error: `AccessTrade API lỗi: ${response.status} ${JSON.stringify(body?.message ?? body)}` },
      { status: 502 },
    );
  }

  const rows = body?.data ?? [];

  // Match each AccessTrade row to our own Click via its trackingId (sent as sub1).
  const subIds = rows.map((r) => r.sub1 ?? r.sub_id).filter((v): v is string => Boolean(v));
  const clicks = subIds.length
    ? await prisma.click.findMany({
        where: { trackingId: { in: subIds } },
        include: { transaction: true, shop: true },
      })
    : [];
  const clickBySubId = new Map(clicks.map((c) => [c.trackingId, c]));

  const rows_ = rows.map((row) => {
    const subId = row.sub1 ?? row.sub_id ?? null;
    const click = subId ? clickBySubId.get(subId) : undefined;
    return {
      externalOrderId: row.transaction_id ?? row.order_id ?? row.click_id ?? "—",
      subId,
      orderAmount: row.order_value ?? row.sale_amount ?? 0,
      commission: row.pub_commission ?? row.commission ?? 0,
      status: row.status ?? row.conversion_status ?? "unknown",
      transactionTime: row.transaction_time ?? null,
      matchedInKback: Boolean(click?.transaction),
      shopName: click?.shop.name ?? null,
    };
  });

  const unmatched = rows_.filter((r) => !r.matchedInKback);

  return NextResponse.json({
    checkedRange: { since: since.toISOString(), until: until.toISOString() },
    totalFromAccessTrade: body?.total ?? rows.length,
    unmatchedCount: unmatched.length,
    unmatched,
    allRows: rows_,
  });
}
