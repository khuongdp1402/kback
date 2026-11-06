"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVnd, formatDate } from "@/lib/format";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count: { transactions: number; payoutRequests: number };
  wallet: { availableBalance: number };
}

export function UserManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function toggleBlocked(id: string, isBlocked: boolean) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked }),
    });
    setUpdatingId(null);
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
      router.refresh();
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Số dư khả dụng</th>
              <th className="px-4 py-3 font-medium">Giao dịch</th>
              <th className="px-4 py-3 font-medium">Ngày tham gia</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "ADMIN" ? "success" : "default"}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatVnd(u.wallet.availableBalance)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.transactions}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.isBlocked ? "danger" : "success"}>
                    {u.isBlocked ? "Đã khoá" : "Hoạt động"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updatingId === u.id}
                    onClick={() => toggleBlocked(u.id, !u.isBlocked)}
                  >
                    {u.isBlocked ? "Mở khoá" : "Khoá"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
