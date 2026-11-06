"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { formatVnd, formatDate } from "@/lib/format";
import { statusLabel, statusTone } from "@/lib/transaction-status";

interface Transaction {
  id: string;
  orderAmount: number;
  cashbackAmount: number;
  status: string;
  createdAt: string;
  shop: { name: string; logoEmoji: string };
  user: { name: string; email: string };
}

const statusOptions = ["PENDING", "CONFIRMED", "EXPIRED", "REJECTED"];

export function TransactionManager({ initialTransactions }: { initialTransactions: Transaction[] & { id: string }[] }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (res.ok) {
      const data = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data.transaction } : t)));
      router.refresh();
    }
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Không có giao dịch nào.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Shop</th>
              <th className="px-4 py-3 font-medium">Ngày</th>
              <th className="px-4 py-3 font-medium">Giá trị đơn</th>
              <th className="px-4 py-3 font-medium">Hoàn tiền</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Đổi trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{tx.user.name}</p>
                  <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {tx.shop.logoEmoji} {tx.shop.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                <td className="px-4 py-3 text-foreground">{formatVnd(tx.orderAmount)}</td>
                <td className="px-4 py-3 font-medium text-brand">{formatVnd(tx.cashbackAmount)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(tx.status)}>{statusLabel(tx.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={tx.status}
                    disabled={updatingId === tx.id}
                    onChange={(e) => updateStatus(tx.id, e.target.value)}
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
