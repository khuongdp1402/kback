import { prisma } from "@/lib/prisma";
import { PayoutManager } from "@/components/admin/payout-manager";

export default async function AdminPayoutsPage() {
  const payoutRequests = await prisma.payoutRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yêu cầu rút tiền</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Duyệt/từ chối yêu cầu, đánh dấu đã chuyển khoản thủ công.
        </p>
      </div>
      <PayoutManager
        initialPayouts={payoutRequests.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
