import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { DashboardSidebarNav, DashboardBottomNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ClipboardLinkDetector } from "@/components/clipboard-link-detector";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-4 md:flex md:flex-col">
        <Logo className="px-2 py-2" />
        <div className="mt-6 flex-1">
          <DashboardSidebarNav />
        </div>
        <div className="border-t border-border px-2 pt-4">
          <p className="truncate text-sm font-medium text-foreground">{session.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
            >
              Trang quản trị
            </Link>
          )}
          <SignOutButton className="mt-2 block" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Logo />
        <SignOutButton />
      </header>

      <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <DashboardBottomNav />
      <ClipboardLinkDetector />
    </div>
  );
}
