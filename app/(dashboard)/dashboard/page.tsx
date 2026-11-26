import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletSummary } from "@/lib/wallet";
import { getMembershipStatus } from "@/lib/membership";
import { formatVnd, formatDate } from "@/lib/format";
import { Card, GoldCard, Badge } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { MembershipCard } from "@/components/membership-card";
import { statusLabel, statusTone } from "@/lib/transaction-status";
import { PasteLinkForm } from "@/components/paste-link-form";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ paste?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const { paste } = await searchParams;
  // Link pasted on the landing page before signup — auto-create the cashback link for it.
  const initialPasteUrl =
    typeof paste === "string" && /^https?:\/\//i.test(paste) ? paste.slice(0, 2048) : undefined;

  const [wallet, membership, recentTransactions] = await Promise.all([
    getWalletSummary(userId),
    getMembershipStatus(userId),
    prisma.transaction.findMany({
      where: { userId },
      include: { shop: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Chào {session.user.name?.split(" ").pop()} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán link mua sắm để tạo liên kết nhận hoàn tiền hoặc quản lý số dư của bạn.
        </p>
      </div>

      {/* Quick Link Generator */}
      <div
        className="rounded-2xl border border-border p-6 shadow-xs"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-light) 0%, var(--surface) 60%)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground text-base">Tạo liên kết hoàn tiền nhanh</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dán link từ Shopee, Lazada, Tiki, TikTok Shop... để nhận link tích lũy hoàn tiền ngay lập tức.
            </p>
          </div>
        </div>
        <PasteLinkForm initialUrl={initialPasteUrl} />
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/shops" size="md">
          Mua sắm & nhận hoàn tiền
        </LinkButton>
        <LinkButton href="/wallet" variant="secondary" size="md">
          Rút tiền
        </LinkButton>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Giao dịch gần đây</h2>
          <Link href="/transactions" className="text-sm font-medium text-brand hover:underline">
            Xem tất cả
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào. Hãy bắt đầu mua sắm để nhận hoàn tiền đầu tiên!
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tx.shop.logoEmoji}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.shop.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display tabular-nums text-sm font-semibold text-foreground">
                    +{formatVnd(tx.cashbackAmount)}
                  </p>
                  <Badge tone={statusTone(tx.status)}>{statusLabel(tx.status)}</Badge>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
