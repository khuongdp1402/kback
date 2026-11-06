"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: "📊" },
  { href: "/admin/shops", label: "Shop đối tác", icon: "🏬" },
  { href: "/admin/products", label: "Sản phẩm", icon: "📦" },
  { href: "/admin/transactions", label: "Giao dịch", icon: "🧾" },
  { href: "/admin/payouts", label: "Yêu cầu rút tiền", icon: "💸" },
  { href: "/admin/users", label: "Người dùng", icon: "👤" },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
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
