import { prisma } from "@/lib/prisma";
import { TransactionManager } from "@/components/admin/transaction-manager";
import { AccessTradeSyncCheck } from "@/components/admin/accesstrade-sync-check";

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: { shop: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Giao dịch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem và can thiệp thủ công trạng thái giao dịch khi cần (tranh chấp, lỗi webhook affiliate).
        </p>
      </div>
      <AccessTradeSyncCheck />
      <TransactionManager
        initialTransactions={transactions.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
