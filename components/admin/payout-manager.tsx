"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVnd, formatDate } from "@/lib/format";
import { payoutStatusLabel, payoutStatusTone } from "@/lib/transaction-status";

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  createdAt: string;
  user: { name: string; email: string };
}

export function PayoutManager({ initialPayouts }: { initialPayouts: PayoutRequest[] }) {
  const router = useRouter();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (res.ok) {
      const data = await res.json();
      setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.payoutRequest } : p)));
      router.refresh();
    }
  }

  if (payouts.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Không có yêu cầu rút tiền nào.
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {payouts.map((p) => (
        <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatVnd(p.amount)} — {p.user.name}
            </p>
            <p className="text-xs text-muted-foreground">{p.user.email}</p>
            <p className="text-xs text-muted-foreground">
              {p.bankName} · {p.bankAccountNumber} · {p.bankAccountName}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={payoutStatusTone(p.status)}>{payoutStatusLabel(p.status)}</Badge>
            {p.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={updatingId === p.id}
                  onClick={() => updateStatus(p.id, "APPROVED")}
                >
                  Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={updatingId === p.id}
                  onClick={() => updateStatus(p.id, "REJECTED")}
                >
                  Từ chối
                </Button>
              </>
            )}
            {p.status === "APPROVED" && (
              <Button
                size="sm"
                disabled={updatingId === p.id}
                onClick={() => updateStatus(p.id, "PAID")}
              >
                Đánh dấu đã chuyển khoản
              </Button>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
