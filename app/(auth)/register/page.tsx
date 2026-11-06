import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-foreground">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Miễn phí đăng ký, bắt đầu nhận hoàn tiền cho mỗi đơn hàng ngay hôm nay.
      </p>
      <div className="mt-6">
        <RegisterForm />
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
