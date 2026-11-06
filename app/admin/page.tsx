import { prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/format";
import { Card } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [userCount, shopCount, pendingTx, confirmedSum, pendingPayouts, pendingPayoutSum] =
    await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { cashbackAmount: true },
      }),
      prisma.payoutRequest.count({ where: { status: "PENDING" } }),
      prisma.payoutRequest.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

  const stats = [
    { label: "Người dùng", value: userCount.toLocaleString("vi-VN") },
    { label: "Shop đối tác", value: shopCount.toLocaleString("vi-VN") },
    { label: "Giao dịch chờ xác nhận", value: pendingTx.toLocaleString("vi-VN") },
    { label: "Tổng đã hoàn (đã xác nhận)", value: formatVnd(confirmedSum._sum.cashbackAmount ?? 0) },
    { label: "Yêu cầu rút tiền chờ duyệt", value: pendingPayouts.toLocaleString("vi-VN") },
    { label: "Số tiền chờ rút", value: formatVnd(pendingPayoutSum._sum.amount ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan quản trị</h1>
        <p className="mt-1 text-sm text-muted-foreground">Số liệu nhanh toàn hệ thống.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
