import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { AppSessionProvider } from "@/components/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "KBack — Mua sắm thật, hoàn tiền thật",
  description:
    "Nhận hoàn tiền mỗi khi mua sắm trên Shopee, Lazada, Tiki, TikTok Shop và ShopeeFood. Đăng ký miễn phí, rút tiền dễ dàng.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KBack",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f5d271'/%3E%3Cstop offset='50%25' stop-color='%23d4a537'/%3E%3Cstop offset='100%25' stop-color='%238a6a1c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='7' fill='url(%23g)'/%3E%3Cpath d='M11 6v20M11 16l11-10M11 16l11 10' fill='none' stroke='%233a2a05' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M25 4l1.2 3.3L29.5 8.5 26.2 9.7 25 13l-1.2-3.3L20.5 8.5l3.3-1.2Z' fill='%23fff'/%3E%3C/svg%3E",
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#a97318",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
