import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVnd, formatDate } from "@/lib/format";
import { Card, Badge } from "@/components/ui/card";
import { statusLabel, statusTone } from "@/lib/transaction-status";
import { tierInfo } from "@/lib/membership";

export default async function TransactionsPage() {
  const session = await auth();
  const transactions = await prisma.transaction.findMany({
    where: { userId: session!.user.id },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lịch sử giao dịch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi trạng thái hoàn tiền cho từng đơn hàng.
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Chưa có giao dịch nào. Ghé trang{" "}
          <a href="/shops" className="font-medium text-brand hover:underline">
            Shop
          </a>{" "}
          để bắt đầu mua sắm và nhận hoàn tiền.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Shop</th>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium">Giá trị đơn</th>
                  <th className="px-4 py-3 font-medium">Hoa hồng gốc</th>
                  <th className="px-4 py-3 font-medium">Hoàn tiền</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{tx.shop.logoEmoji}</span>
                        <span className="font-medium text-foreground">{tx.shop.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                    <td className="font-display tabular-nums px-4 py-3 text-foreground">
                      {formatVnd(tx.orderAmount)}
                    </td>
                    <td className="font-display tabular-nums px-4 py-3 text-muted-foreground">
                      {formatVnd(tx.baseCashbackAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-display tabular-nums font-medium text-brand">
                        {formatVnd(tx.cashbackAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hạng {tierInfo(tx.memberTier).label} · {Math.round(tierInfo(tx.memberTier).shareRate * 100)}%
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(tx.status)}>{statusLabel(tx.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
