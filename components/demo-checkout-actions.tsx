"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";

export function DemoCheckoutActions({ subId }: { subId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!subId) return null;

  async function simulateOrder(confirmNow: boolean) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/demo/simulate-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subId, confirmNow }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không thể mô phỏng giao dịch");
        return;
      }
      const tx = data.transaction;
      setMessage(
        `Đã ghi nhận đơn mẫu ${formatVnd(tx.orderAmount)} → hoàn ${formatVnd(tx.cashbackAmount)} (${tx.status === "CONFIRMED" ? "Đã xác nhận vào ví" : "Chờ xác nhận"}).`,
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 space-y-2.5">
      <Button
        type="button"
        onClick={() => simulateOrder(true)}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Đang tạo giao dịch..." : "Giả lập mua hàng & cộng tiền ngay"}
      </Button>
      {message && <p className="text-xs font-medium text-brand-dark">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
