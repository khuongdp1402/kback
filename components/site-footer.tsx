import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Mua sắm ngay hôm nay, nhận hoàn tiền thật cho mỗi đơn hàng trên các sàn TMĐT bạn
              yêu thích.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sản phẩm</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground">Cách hoạt động</a></li>
              <li><a href="#shops" className="hover:text-foreground">Đối tác hoàn tiền</a></li>
              <li><a href="#faq" className="hover:text-foreground">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tài khoản</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/register" className="hover:text-foreground">Đăng ký</a></li>
              <li><a href="/login" className="hover:text-foreground">Đăng nhập</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Công ty</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/gioi-thieu" className="hover:text-foreground">Về KBack</a></li>
              <li><a href="/dieu-khoan" className="hover:text-foreground">Điều khoản sử dụng</a></li>
              <li><a href="/chinh-sach-bao-mat" className="hover:text-foreground">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KBack. Đây là sản phẩm demo, không liên kết với bất kỳ
          sàn TMĐT nào được đề cập.
        </div>
      </div>
    </footer>
  );
}
