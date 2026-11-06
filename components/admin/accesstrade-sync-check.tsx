"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";

interface UnmatchedRow {
  externalOrderId: string;
  subId: string | null;
  orderAmount: number;
  commission: number;
  status: string;
  transactionTime: string | null;
  shopName: string | null;
}

interface SyncResult {
  totalFromAccessTrade: number;
  unmatchedCount: number;
  unmatched: UnmatchedRow[];
  checkedRange: { since: string; until: string };
}

/**
 * Manual reconciliation widget: pulls real transactions from AccessTrade's Report API for the
 * last N days and flags any that have no matching Transaction in KBack yet — the signal that
 * the postback webhook missed something and a transaction needs to be created/updated by hand
 * via the table below.
 */
export function AccessTradeSyncCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/accesstrade/sync-check?days=30");
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không thể kiểm tra AccessTrade");
      return;
    }
    setResult(data);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">Đối soát với AccessTrade</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            So sánh giao dịch thật từ AccessTrade (30 ngày gần nhất) với dữ liệu KBack, phát
            hiện đơn AccessTrade đã ghi nhận nhưng chưa cập nhật ở đây.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleCheck} disabled={loading}>
          {loading ? "Đang kiểm tra..." : "Kiểm tra AccessTrade"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            AccessTrade ghi nhận <strong>{result.totalFromAccessTrade}</strong> giao dịch trong
            30 ngày qua.{" "}
            {result.unmatchedCount === 0 ? (
              <span className="text-accent">Tất cả đã khớp với KBack ✅</span>
            ) : (
              <span className="text-red-600">
                {result.unmatchedCount} giao dịch chưa khớp — cần kiểm tra thủ công.
              </span>
            )}
          </p>

          {result.unmatched.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mã đơn AccessTrade</th>
                    <th className="px-3 py-2 font-medium">SubID</th>
                    <th className="px-3 py-2 font-medium">Giá trị đơn</th>
                    <th className="px-3 py-2 font-medium">Hoa hồng</th>
                    <th className="px-3 py-2 font-medium">Trạng thái AT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.unmatched.map((row) => (
                    <tr key={row.externalOrderId + row.subId}>
                      <td className="px-3 py-2 font-mono text-xs">{row.externalOrderId}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.subId ?? "—"}
                      </td>
                      <td className="px-3 py-2">{formatVnd(row.orderAmount)}</td>
                      <td className="px-3 py-2">{formatVnd(row.commission)}</td>
                      <td className="px-3 py-2">
                        <Badge tone="warning">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
