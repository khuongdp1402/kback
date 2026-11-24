"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export function ShareTargetHandler({ sharedUrl }: { sharedUrl: string | null }) {
  const [loading, setLoading] = useState(Boolean(sharedUrl));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    trackedUrl: string;
    shopName: string;
    shopEmoji: string;
  } | null>(null);

  useEffect(() => {
    if (!sharedUrl) return;
    let cancelled = false;

    async function convert() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/affiliate/paste-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: sharedUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Không thể tạo liên kết hoàn tiền");
        } else {
          setResult({
            trackedUrl: data.trackedUrl,
            shopName: data.shop?.name ?? "Sàn TMĐT",
            shopEmoji: data.shop?.logoEmoji ?? "🛍️",
          });
        }
      } catch {
        if (!cancelled) setError("Lỗi kết nối máy chủ, vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void convert();
    return () => {
      cancelled = true;
    };
  }, [sharedUrl]);

  if (!sharedUrl) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy đường dẫn sản phẩm trong nội dung bạn vừa chia sẻ.
        </p>
        <LinkButton href="/dashboard" className="mt-4">
          Quay về trang chính
        </LinkButton>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-xs font-medium text-muted-foreground">Đường dẫn nhận được</p>
      <p className="mt-1 break-all rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground">
        {sharedUrl}
      </p>

      {loading && (
        <p className="mt-5 text-sm text-muted-foreground">Đang tạo liên kết hoàn tiền...</p>
      )}

      {error && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/dashboard" className="inline-block text-sm font-medium text-brand hover:underline">
            Thử dán link thủ công tại trang chính
          </Link>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <p className="text-sm font-medium text-foreground">
            {result.shopEmoji} Đã kích hoạt hoàn tiền cho <strong>{result.shopName}</strong>!
          </p>
          <a
            href={result.trackedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Mở liên kết & mua ngay
          </a>
        </div>
      )}
    </Card>
  );
}
