import { LinkButton } from "@/components/ui/button";
import { Card, GoldCard } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/format";

const steps = [
  {
    title: "Chọn shop & bấm mua",
    description:
      "Duyệt danh sách Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood ngay trên KBack rồi bấm \"Mua ngay & nhận hoàn tiền\".",
  },
  {
    title: "Mua sắm như bình thường",
    description:
      "Bạn được chuyển thẳng tới sàn quen thuộc, thanh toán và mua sắm hoàn toàn bình thường — không cần thêm bước nào khác.",
  },
  {
    title: "Nhận hoàn tiền vào ví",
    description:
      "Sau khi đơn hàng được xác nhận, tiền hoàn sẽ tự động cộng vào ví KBack của bạn để rút về tài khoản ngân hàng.",
  },
];

const faqs = [
  {
    q: "KBack hoạt động như thế nào?",
    a: "Khi bạn mua sắm qua liên kết của KBack, sàn TMĐT trả một khoản hoa hồng affiliate cho chúng tôi. Chúng tôi chia sẻ lại phần lớn khoản đó cho bạn dưới dạng hoàn tiền.",
  },
  {
    q: "Bao lâu thì tôi nhận được tiền hoàn?",
    a: "Tuỳ chính sách từng sàn, giao dịch thường ở trạng thái “chờ xác nhận” trong vài ngày đến vài tuần trước khi được xác nhận và cộng vào số dư khả dụng.",
  },
  {
    q: "Tôi có thể rút tiền bằng cách nào?",
    a: "Sau khi số dư khả dụng đủ điều kiện, bạn có thể tạo yêu cầu rút tiền về tài khoản ngân hàng bất kỳ lúc nào từ trang Ví.",
  },
  {
    q: "Mua hàng qua KBack có tốn thêm phí không?",
    a: "Không. Giá sản phẩm hoàn toàn giống như khi bạn mua trực tiếp trên sàn — hoàn tiền là một phần hoa hồng affiliate mà KBack chia sẻ lại cho bạn.",
  },
];

export const revalidate = 300;

const FALLBACK_SHOPS = [
  { id: "shopee", name: "Shopee", logoEmoji: "🛒", cashbackRate: 4.5 },
  { id: "lazada", name: "Lazada", logoEmoji: "🛍️", cashbackRate: 3.8 },
  { id: "tiki", name: "Tiki", logoEmoji: "📚", cashbackRate: 3.2 },
  { id: "tiktok-shop", name: "TikTok Shop", logoEmoji: "🎵", cashbackRate: 5.0 },
  { id: "shopeefood", name: "ShopeeFood", logoEmoji: "🍜", cashbackRate: 6.0 },
];

export default async function LandingPage() {
  let shops: { id: string; name: string; logoEmoji: string; cashbackRate: number }[] =
    FALLBACK_SHOPS;
  try {
    const dbShops = await prisma.shop.findMany({
      orderBy: { cashbackRate: "desc" },
      select: { id: true, name: true, logoEmoji: true, cashbackRate: true },
    });
    if (dbShops.length > 0) {
      shops = dbShops;
    }
  } catch (err) {
    console.error("[landing] Failed to load shops from DB, using fallback list:", err);
  }
  const topRate = shops[0]?.cashbackRate ?? 6;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 50% -10%, var(--brand-light), var(--background) 70%)",
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <span className="inline-block rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-brand-dark shadow-sm ring-1 ring-border">
              Hoàn tiền lên đến <span className="font-display tabular-nums">{topRate}%</span> mỗi
              đơn hàng
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Mua sắm thật,{" "}
              <span className="text-brand">hoàn tiền thật</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
              Nhận lại tiền mặt cho mỗi đơn hàng trên Shopee, Lazada, Tiki, TikTok Shop và
              ShopeeFood — chỉ cần bấm mua qua KBack, không tốn thêm phí.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <LinkButton href="/register" size="lg">
                Đăng ký nhận hoàn tiền
              </LinkButton>
              <LinkButton href="#how-it-works" variant="secondary" size="lg">
                Xem cách hoạt động
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Miễn phí đăng ký · Không ràng buộc · Rút tiền linh hoạt
            </p>
          </div>

          {/* Hero wallet visual */}
          <div className="mx-auto w-full max-w-sm lg:mx-0">
            <GoldCard className="p-7">
              <p className="text-sm font-medium text-[#3a2a05]/80">Ví hoàn tiền</p>
              <p className="font-display tabular-nums mt-2 text-4xl font-semibold text-[#2b1e04]">
                {formatVnd(432000)}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-[#3a2a05]/15 pt-4 text-sm text-[#3a2a05]/80">
                <span>Hạng Bạc</span>
                <span className="font-display tabular-nums font-semibold">65%</span>
              </div>
            </GoldCard>
            <Card className="-mt-6 ml-6 w-48 p-4">
              <p className="text-xs text-muted-foreground">Đơn hàng Tiki</p>
              <p className="font-display tabular-nums mt-1 text-lg font-semibold text-accent">
                +{formatVnd(28500)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Đã xác nhận</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section id="shops" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Hoàn tiền trên các sàn bạn đã tin dùng
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Không cần đổi thói quen mua sắm — chỉ cần bắt đầu từ KBack.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="flex flex-col items-center gap-2 p-6 text-center transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{shop.logoEmoji}</span>
              <span className="font-semibold text-foreground">{shop.name}</span>
              <span className="font-display tabular-nums text-sm font-medium text-brand">
                Đến {shop.cashbackRate}%
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Chỉ 3 bước để nhận hoàn tiền
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <span className="font-display block text-5xl font-light text-brand/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Người dùng nói gì về KBack
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Minh Anh",
              quote:
                "Mình mua sắm online hàng tuần, từ ngày dùng KBack mỗi tháng nhận thêm cả trăm nghìn tiền hoàn, rất đáng để duy trì thói quen.",
            },
            {
              name: "Quốc Bảo",
              quote:
                "Giao diện dễ dùng, thao tác nhanh gọn trên điện thoại. Rút tiền về tài khoản cũng nhanh, không rắc rối.",
            },
            {
              name: "Thu Hà",
              quote:
                "Thích nhất là theo dõi được trạng thái từng đơn hàng, biết rõ khi nào tiền về ví, rất minh bạch.",
            },
          ].map((t) => (
            <Card key={t.name} className="p-6">
              <p className="text-sm text-foreground">“{t.quote}”</p>
              <p className="mt-4 text-sm font-semibold text-muted-foreground">— {t.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Câu hỏi thường gặp
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-background p-5 open:bg-brand-light/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                  {faq.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
          Sẵn sàng nhận hoàn tiền cho lần mua sắm tiếp theo?
        </h2>
        <div className="mt-8">
          <LinkButton href="/register" size="lg">
            Tạo tài khoản miễn phí
          </LinkButton>
        </div>
      </section>
    </>
  );
}
