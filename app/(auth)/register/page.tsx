import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthConfigured } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const googleEnabled = isGoogleAuthConfigured();
  const { url } = await searchParams;
  // Product link pasted on the landing page — carried through signup so the dashboard can create
  // the cashback link immediately instead of making the visitor paste it a second time.
  const pasteUrl = typeof url === "string" && /^https?:\/\//i.test(url) ? url.slice(0, 2048) : undefined;
  const afterAuthPath = pasteUrl ? `/dashboard?paste=${encodeURIComponent(pasteUrl)}` : "/dashboard";

  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-foreground">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pasteUrl
          ? "Chỉ một bước nữa — tạo tài khoản là KBack tạo ngay link hoàn tiền cho sản phẩm bạn vừa dán."
          : "Miễn phí đăng ký, bắt đầu nhận hoàn tiền cho mỗi đơn hàng ngay hôm nay."}
      </p>
      <div className="mt-6">
        <RegisterForm googleEnabled={googleEnabled} afterAuthPath={afterAuthPath} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}
