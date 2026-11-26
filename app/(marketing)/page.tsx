import { LinkButton } from "@/components/ui/button";
import { Card, GoldCard } from "@/components/ui/card";
import { PasteLinkForm } from "@/components/paste-link-form";
import { prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/format";
import { estimateCashbackVnd, NEW_MEMBER_SHARE, publicRateRange } from "@/lib/cashback-rate";
import { TIERS } from "@/lib/membership";

const steps = [
  {
    title: "Dán link hoặc chọn shop",
    description:
      "Dán link sản phẩm Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood — KBack cho bạn biết ngay sẽ được hoàn bao nhiêu tiền.",
  },
  {
    title: "Mua sắm như bình thường",
    description:
      "Bạn được chuyển thẳng tới sàn quen thuộc, thanh toán và mua sắm hoàn toàn bình thường — giá không đổi.",
  },
  {
    title: "Nhận hoàn tiền vào ví",
    description:
      "Đơn được ghi nhận ngay ở trạng thái “chờ xác nhận”. Khi sàn xác nhận (thường 30–60 ngày), tiền vào ví và rút về ngân hàng.",
  },
];

const promises = [
  {
    title: "Con số thật, không phải “lên tới”",
    description:
      "Tỷ lệ hiển thị là mức bạn thực nhận ở hạng hiện tại — không phải hoa hồng sàn trả cho KBack.",
  },
  {
    title: "Nói trước thời gian chờ",
    description:
      "Sàn cần 30–60 ngày để hết hạn đổi trả và đối soát. Chúng tôi ghi rõ thời gian dự kiến cho từng sàn.",
  },
  {
    title: "Theo dõi từng đơn",
    description:
      "Mỗi đơn hiện rõ trạng thái chờ xác nhận / đã xác nhận / bị huỷ, kèm số tiền hoàn tương ứng.",
  },
];

const faqs = [
  {
    q: "KBack hoạt động như thế nào?",
    a: `Khi bạn mua sắm qua liên kết của KBack, sàn TMĐT trả một khoản hoa hồng affiliate cho chúng tôi. Bạn nhận ${Math.round(TIERS[0].shareRate * 100)}%–${Math.round(TIERS[TIERS.length - 1].shareRate * 100)}% khoản đó (tuỳ hạng thành viên) dưới dạng hoàn tiền — ví dụ sàn trả 10% thì bạn nhận ít nhất ${Math.round(TIERS[0].shareRate * 10)}%.`,
  },
  {
    q: "Bao lâu thì tôi nhận được tiền hoàn?",
    a: "Đơn hàng hiện trong ví ở trạng thái “chờ xác nhận” ngay sau khi sàn ghi nhận. Sàn thường cần 30–60 ngày (hết thời hạn đổi trả + đối soát) để xác nhận; ShopeeFood thường nhanh hơn. Sau khi xác nhận, tiền chuyển sang số dư khả dụng.",
  },
  {
    q: "Vì sao có đơn bị huỷ hoàn tiền?",
    a: "Nếu đơn bị trả hàng, huỷ, hoặc sàn không ghi nhận (ví dụ bạn mở link khác trước khi thanh toán, dùng một số voucher không áp dụng hoa hồng), sàn sẽ không trả hoa hồng cho đơn đó.",
  },
  {
    q: "Tôi có thể rút tiền bằng cách nào?",
    a: "Khi số dư khả dụng đủ mức tối thiểu, bạn tạo yêu cầu rút tiền về tài khoản ngân hàng bất kỳ lúc nào từ trang Ví.",
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

const EXAMPLE_ORDER = 500_000;

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

  // Illustrative example uses the most common marketplace (Shopee) if present, at the
  // new-member rate — i.e. what a visitor would actually get right after signing up.
  const exampleShop = shops.find((s) => s.name.toLowerCase() === "shopee") ?? shops[0];
  const exampleRate = exampleShop ? publicRateRange(exampleShop.cashbackRate).from : 0;
  const exampleCashback = exampleShop
    ? estimateCashbackVnd(EXAMPLE_ORDER, exampleShop.cashbackRate, NEW_MEMBER_SHARE)
    : 0;

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
              Biết trước được hoàn bao nhiêu — trước khi mua
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Mua sắm thật,{" "}
              <span className="text-brand">hoàn tiền thật</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
              Dán link sản phẩm Shopee, Lazada, Tiki, TikTok Shop hoặc ShopeeFood để xem ngay số
              tiền bạn được hoàn. Giá không đổi, không tốn thêm phí.
            </p>
            <div className="mt-8">
              <PasteLinkForm mode="public" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <LinkButton href="/register" variant="secondary" size="md">
                Đăng ký miễn phí
              </LinkButton>
              <LinkButton href="#how-it-works" variant="ghost" size="md">
                Xem cách hoạt động
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Không cần đăng nhập để xem ước tính · Rút tiền về ngân hàng
            </p>
          </div>

          {/* Hero visual — clearly labelled as an illustration computed from real rates */}
          {exampleShop && (
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <GoldCard className="p-7">
                <p className="text-sm font-medium text-[#3a2a05]/80">
                  Ví dụ: đơn {exampleShop.name} {formatVnd(EXAMPLE_ORDER)}
                </p>
                <p className="font-display tabular-nums mt-2 text-4xl font-semibold text-[#2b1e04]">
                  +{formatVnd(exampleCashback)}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-[#3a2a05]/15 pt-4 text-sm text-[#3a2a05]/80">
                  <span>Hạng Thành viên</span>
                  <span className="font-display tabular-nums font-semibold">{exampleRate}%</span>
                </div>
              </GoldCard>
              <Card className="-mt-6 ml-6 w-56 p-4">
                <p className="text-xs text-muted-foreground">Thời gian về ví</p>
                <p className="font-display mt-1 text-lg font-semibold text-accent">30–60 ngày</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Sau khi sàn xác nhận đơn</p>
              </Card>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Minh hoạ tính theo tỷ lệ hiện tại, số thực tế phụ thuộc giá trị và loại sản phẩm.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Partner logos */}
      <section id="shops" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Hoàn tiền trên các sàn bạn đã tin dùng
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Tỷ lệ dưới đây là mức <strong>bạn thực nhận</strong> khi mới đăng ký. Mua càng nhiều,
          hạng càng cao, tỷ lệ càng tăng.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {shops.map((shop) => {
            const range = publicRateRange(shop.cashbackRate);
            return (
              <Card
                key={shop.id}
                className="flex flex-col items-center gap-2 p-6 text-center transition-shadow hover:shadow-md"
              >
                <span className="text-3xl">{shop.logoEmoji}</span>
                <span className="font-semibold text-foreground">{shop.name}</span>
                <span className="font-display tabular-nums text-sm font-medium text-brand">
                  Hoàn {range.from}%
                </span>
                <span className="text-xs text-muted-foreground">Hạng Vàng: {range.upTo}%</span>
              </Card>
            );
          })}
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

      {/* Transparency promises (replaces placeholder testimonials until there are real ones) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          Cam kết minh bạch của KBack
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          KBack đang trong giai đoạn thử nghiệm. Đây là những điều chúng tôi cam kết với bạn.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {promises.map((p) => (
            <Card key={p.title} className="p-6">
              <p className="font-semibold text-foreground">{p.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
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
