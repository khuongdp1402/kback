import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function DemoCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; sub?: string }>;
}) {
  const { target } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-brand-light px-4 py-12">
      <Logo className="mb-8" />
      <Card className="max-w-md p-8 text-center">
        <span className="text-4xl">🧾</span>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Mô phỏng trang thanh toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đây là chế độ demo (không có API key affiliate thật) — bình thường bạn sẽ được chuyển
          tới:
        </p>
        <p className="mt-2 break-all rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground">
          {target ?? "—"}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Một giao dịch mô phỏng sẽ tự động xuất hiện trong{" "}
          <Link href="/transactions" className="font-medium text-brand hover:underline">
            lịch sử giao dịch
          </Link>{" "}
          của bạn sau ít phút.
        </p>
        <LinkButton href="/transactions" className="mt-6">
          Xem lịch sử giao dịch
        </LinkButton>
      </Card>
    </div>
  );
}
