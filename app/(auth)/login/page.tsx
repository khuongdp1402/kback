import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-foreground">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chào mừng quay lại KBack, tiếp tục nhận hoàn tiền cho mỗi đơn hàng.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </Card>
  );
}
