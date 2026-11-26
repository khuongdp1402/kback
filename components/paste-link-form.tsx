"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CashbackEstimate } from "@/lib/cashback-rate";

function vnd(n: number) {
  return `${n.toLocaleString("vi-VN")}₫`;
}

export function EstimateSummary({ estimate }: { estimate: CashbackEstimate }) {
  const mid = estimate.examples[1] ?? estimate.examples[0];
  return (
    <div className="rounded-lg bg-surface/80 p-3.5 text-sm">
      <p className="text-foreground">
        Bạn được hoàn <strong className="font-display tabular-nums text-brand-dark">{estimate.userRate}%</strong>{" "}
        giá trị đơn{" "}
        <span className="text-muted-foreground">(hạng {estimate.tierLabel})</span>
        {mid && (
          <>
            {" "}
            — đơn {vnd(mid.orderAmount)} ≈{" "}
            <strong className="font-display tabular-nums text-accent">+{vnd(mid.cashback)}</strong>
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Tiền về ví sau khi sàn xác nhận đơn, thường {estimate.settlement}.
        {estimate.topTierRate > estimate.userRate &&
          ` Hạng Vàng được hoàn tới ${estimate.topTierRate}%.`}
      </p>
    </div>
  );
}

interface PasteLinkFormProps {
  /**
   * "auth" (default): signed-in user — creates a tracked link.
   * "public": landing-page visitor — only shows the estimate, then invites them to register
   * while carrying the pasted URL through signup so they don't have to paste it again.
   */
  mode?: "auth" | "public";
  /** Pre-filled URL (e.g. carried over from the landing page through registration). */
  initialUrl?: string;
}

export function PasteLinkForm({ mode = "auth", initialUrl = "" }: PasteLinkFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [estimate, setEstimate] = useState<CashbackEstimate | null>(null);
  const [result, setResult] = useState<{ trackedUrl: string; shopName: string; shopEmoji: string } | null>(
    null,
  );
  const autoSubmitted = useRef(false);

  async function submit(targetUrl: string) {
    setError(null);
    setResult(null);
    setEstimate(null);
    setCopied(false);
    setLoading(true);

    const endpoint = mode === "public" ? "/api/affiliate/estimate" : "/api/affiliate/paste-link";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không thể tạo liên kết hoàn tiền");
      return;
    }

    setEstimate(data.estimate ?? null);
    if (mode === "public") return;

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

  // A URL carried over from the landing page → create the link right away after signup.
  useEffect(() => {
    if (initialUrl && mode === "auth" && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl, mode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit(url);
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

  const submitLabel =
    mode === "public"
      ? loading
        ? "Đang tính..."
        : "Xem được hoàn bao nhiêu"
      : loading
        ? "Đang tạo liên kết..."
        : "Tạo liên kết hoàn tiền";

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
          {submitLabel}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {mode === "public" && estimate && (
        <div className="mt-4 space-y-3 rounded-xl border border-brand/20 bg-brand-light/60 p-4.5 text-left shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{estimate.shopEmoji}</span>
            <p className="text-sm font-semibold text-brand-dark">
              KBack nhận hoàn tiền cho sản phẩm {estimate.shopName} này
            </p>
          </div>
          <EstimateSummary estimate={estimate} />
          <Link
            href={`/register?url=${encodeURIComponent(url)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto"
          >
            Tạo tài khoản miễn phí để lấy link
          </Link>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/60 p-4.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{result.shopEmoji}</span>
            <p className="text-sm font-semibold text-brand-dark">
              Đã tạo liên kết thành công cho sàn {result.shopName}!
            </p>
          </div>

          {estimate && (
            <div className="mt-3">
              <EstimateSummary estimate={estimate} />
            </div>
          )}

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
