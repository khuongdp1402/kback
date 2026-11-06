import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/require-admin";
import { Logo } from "@/components/logo";
import { AdminSidebarNav } from "@/components/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-4 md:flex md:flex-col">
        <Logo className="px-2 py-2" />
        <p className="mt-1 px-2 text-xs font-medium text-brand">Quản trị</p>
        <div className="mt-6 flex-1">
          <AdminSidebarNav />
        </div>
        <div className="border-t border-border px-2 pt-4">
          <p className="truncate text-sm font-medium text-foreground">{session.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          <SignOutButton className="mt-2 inline-block" />
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div>
          <Logo />
          <p className="text-xs font-medium text-brand">Quản trị</p>
        </div>
        <SignOutButton />
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
