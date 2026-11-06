"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PasteLinkForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ trackedUrl: string; shopName: string; shopEmoji: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);
    setLoading(true);

    const res = await fetch("/api/affiliate/paste-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không thể tạo liên kết hoàn tiền");
      return;
    }

    // If trackedUrl is relative, convert to absolute URL
    let finalUrl = data.trackedUrl as string;
    if (finalUrl && finalUrl.startsWith("/")) {
      finalUrl = `${window.location.origin}${finalUrl}`;
    }

    setResult({
      trackedUrl: finalUrl,
      shopName: data.shop?.name ?? "",
      shopEmoji: data.shop?.logoEmoji ?? "🛍️",
    });
  }

  async function handleCopy() {
    if (!result?.trackedUrl) return;
    try {
      await navigator.clipboard.writeText(result.trackedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is unavailable
      const el = document.createElement("textarea");
      el.value = result.trackedUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Dán đường dẫn sản phẩm Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood..."
          className="w-full flex-1 rounded-full border border-border bg-surface px-4.5 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? "Đang tạo liên kết..." : "Tạo liên kết hoàn tiền"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/60 p-4.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{result.shopEmoji}</span>
            <p className="text-sm font-semibold text-brand-dark">
              Đã tạo liên kết thành công cho sàn {result.shopName}!
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={result.trackedUrl}
                className="w-full rounded-lg border border-border/80 bg-surface px-3 py-2 pr-10 text-xs font-mono text-foreground select-all outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-surface border border-border px-3 text-xs font-medium text-foreground hover:bg-neutral-50 active:bg-neutral-100 transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-700 font-semibold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Sao chép link</span>
                </>
              )}
            </button>
            <a
              href={result.trackedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-medium text-white hover:bg-brand-dark transition-colors shrink-0"
            >
              <span>Mở liên kết ngay</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
