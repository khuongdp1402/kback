import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletSummary } from "@/lib/wallet";
import { getMembershipStatus } from "@/lib/membership";
import { formatVnd, formatDate } from "@/lib/format";
import { Card, GoldCard, Badge } from "@/components/ui/card";
import { PayoutForm } from "@/components/payout-form";
import { MembershipCard } from "@/components/membership-card";
import { payoutStatusLabel, payoutStatusTone } from "@/lib/transaction-status";

export default async function WalletPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [wallet, membership, payoutRequests] = await Promise.all([
    getWalletSummary(userId),
    getMembershipStatus(userId),
    prisma.payoutRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ví hoàn tiền</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý số dư và yêu cầu rút tiền về tài khoản ngân hàng.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GoldCard className="p-6 lg:col-span-2">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#3a2a05]/80">Số dư khả dụng</p>
              <p className="font-display tabular-nums mt-1 text-4xl font-semibold text-[#2b1e04] sm:text-5xl">
                {formatVnd(wallet.availableBalance)}
              </p>
            </div>
            <div className="flex gap-6 border-t border-[#3a2a05]/15 pt-4 text-sm sm:border-t-0 sm:pt-0 sm:text-right">
              <div>
                <p className="text-[#3a2a05]/70">Chờ xác nhận</p>
                <p className="font-display tabular-nums font-semibold text-[#2b1e04]">
                  {formatVnd(wallet.pendingBalance)}
                </p>
              </div>
              <div>
                <p className="text-[#3a2a05]/70">Đã rút</p>
                <p className="font-display tabular-nums font-semibold text-[#2b1e04]">
                  {formatVnd(wallet.paidOut)}
                </p>
              </div>
            </div>
          </div>
        </GoldCard>
        <MembershipCard membership={membership} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Yêu cầu rút tiền</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tối đa {formatVnd(wallet.availableBalance)} khả dụng để rút.
          </p>
          <div className="mt-5">
            <PayoutForm availableBalance={wallet.availableBalance} />
          </div>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Lịch sử rút tiền</h2>
          {payoutRequests.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu rút tiền nào.
            </Card>
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {payoutRequests.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-display tabular-nums text-sm font-medium text-foreground">
                      {formatVnd(p.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.bankName} · {p.bankAccountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                  <Badge tone={payoutStatusTone(p.status)}>{payoutStatusLabel(p.status)}</Badge>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
