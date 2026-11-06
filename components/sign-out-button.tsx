"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`text-sm font-medium text-muted-foreground hover:text-foreground ${className}`}
    >
      Đăng xuất
    </button>
  );
}
