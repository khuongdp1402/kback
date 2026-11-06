import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { PasteLinkForm } from "@/components/paste-link-form";

export default async function ShopsPage() {
  const shops = await prisma.shop.findMany({ orderBy: { cashbackRate: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shop đối tác</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bấm &quot;Mua ngay&quot; để mở shop qua liên kết theo dõi hoàn tiền của KBack.
        </p>
      </div>

      <div
        className="rounded-2xl border border-border p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-light) 0%, var(--surface) 60%)",
        }}
      >
        <h2 className="font-semibold text-foreground">Có sẵn link sản phẩm?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán đường dẫn sản phẩm hoặc link chia sẻ bất kỳ — hệ thống tự nhận diện sàn và tạo
          liên kết hoàn tiền cho bạn.
        </p>
        <div className="mt-4">
          <PasteLinkForm />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <Card
            key={shop.id}
            className="flex flex-col p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-2xl">
                {shop.logoEmoji}
              </span>
              <div>
                <p className="font-semibold text-foreground">{shop.name}</p>
                <p className="font-display tabular-nums text-sm font-medium text-brand">
                  Hoàn tới {shop.cashbackRate}%
                </p>
              </div>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{shop.description}</p>
            <LinkButton
              href={`/api/affiliate/redirect/${shop.slug}`}
              className="mt-4"
              size="sm"
            >
              Mua ngay & nhận hoàn tiền
            </LinkButton>
          </Card>
        ))}
      </div>
    </div>
  );
}
