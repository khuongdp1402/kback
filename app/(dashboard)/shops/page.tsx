import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { PasteLinkForm } from "@/components/paste-link-form";
import { getMembershipStatus } from "@/lib/membership";
import { publicRateRange, settlementLabel, userCashbackRate } from "@/lib/cashback-rate";

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; shop?: string }>;
}) {
  const session = await auth();
  const [shops, query, membership] = await Promise.all([
    prisma.shop.findMany({ orderBy: { cashbackRate: "desc" } }),
    searchParams,
    session?.user?.id ? getMembershipStatus(session.user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shop đối tác</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bấm &quot;Mua ngay&quot; để mở shop qua liên kết theo dõi hoàn tiền của KBack.
          {membership && (
            <>
              {" "}
              Tỷ lệ bên dưới là mức <strong>bạn thực nhận</strong> ở hạng {membership.label}.
            </>
          )}
        </p>
      </div>

      {query.error === "link_unavailable" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tạo liên kết hoàn tiền cho{" "}
          <strong>{query.shop ?? "sàn này"}</strong> ngay lúc này. Vui lòng thử lại sau hoặc kiểm
          tra cấu hình chiến dịch affiliate.
        </div>
      )}

      <div
        className="rounded-2xl border border-border p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-light) 0%, var(--surface) 60%)",
        }}
      >
        <h2 className="font-semibold text-foreground">Có sẵn link sản phẩm?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán đường dẫn sản phẩm hoặc link chia sẻ bất kỳ — hệ thống tự nhận diện sàn, tạo
          liên kết hoàn tiền và cho bạn biết trước sẽ được hoàn bao nhiêu.
        </p>
        <div className="mt-4">
          <PasteLinkForm />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => {
          const rate = membership
            ? userCashbackRate(shop.cashbackRate, membership.shareRate)
            : publicRateRange(shop.cashbackRate).from;
          const topRate = publicRateRange(shop.cashbackRate).upTo;
          return (
            <Card key={shop.id} className="flex flex-col p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-2xl">
                  {shop.logoEmoji}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{shop.name}</p>
                  <p className="font-display tabular-nums text-sm font-medium text-brand">
                    Bạn được hoàn {rate}%
                  </p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{shop.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Tiền về ví sau {settlementLabel(shop.network)}
                {topRate > rate && ` · Hạng Vàng: ${topRate}%`}
              </p>
              <LinkButton
                href={`/api/affiliate/redirect/${shop.slug}`}
                className="mt-4"
                size="sm"
              >
                Mua ngay & nhận hoàn tiền
              </LinkButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
