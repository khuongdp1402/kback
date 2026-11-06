import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how-it-works" className="hover:text-foreground">
            Cách hoạt động
          </a>
          <a href="#shops" className="hover:text-foreground">
            Đối tác
          </a>
          <a href="#faq" className="hover:text-foreground">
            Câu hỏi thường gặp
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <LinkButton href="/dashboard" size="sm">
              Vào trang cá nhân
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Đăng nhập
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Đăng ký miễn phí
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
