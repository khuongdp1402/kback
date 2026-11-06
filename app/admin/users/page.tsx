import { prisma } from "@/lib/prisma";
import { getWalletSummary } from "@/lib/wallet";
import { UserManager } from "@/components/admin/user-manager";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { transactions: true, payoutRequests: true } },
    },
  });

  const usersWithWallet = await Promise.all(
    users.map(async (u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      wallet: await getWalletSummary(u.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Người dùng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem danh sách, khoá/mở khoá tài khoản.
        </p>
      </div>
      <UserManager initialUsers={usersWithWallet} />
    </div>
  );
}
