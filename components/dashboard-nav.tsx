"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: "🏠" },
  { href: "/shops", label: "Shop", icon: "🛍️" },
  { href: "/transactions", label: "Giao dịch", icon: "🧾" },
  { href: "/wallet", label: "Ví", icon: "💰" },
];

const secondaryNavItems = [{ href: "/telegram", label: "Telegram Bot", icon: "✈️" }];

export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {[...navItems, ...secondaryNavItems].map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-light text-brand-dark"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              active ? "text-brand" : "text-muted-foreground"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
