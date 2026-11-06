"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { quickGuessNetworkLabel } from "@/lib/quick-domain-guess";

const DISMISSED_KEY_PREFIX = "kback:clipboard-dismissed:";

/**
 * Mimics the "clipboard cashback prompt" pattern real cashback apps use on mobile, where a
 * browser extension isn't available: the user shares a product link from the
 * Shopee/Lazada/Tiki/TikTok Shop app (their native Share → Copy link action), switches back to
 * KBack, and taps a floating pill to check whether their clipboard holds a product link.
 *
 * We deliberately never call navigator.clipboard.readText() from a focus/visibilitychange
 * handler — that fires without a direct user gesture, and both iOS Safari and Chrome/Android
 * require a gesture-triggered call or they silently reject/prompt every single time. The pill
 * tap itself is the gesture, so the read happens synchronously inside its click handler.
 */
// Clipboard read support only exists client-side; this module only ever runs in a client
// component, and the value can't change at runtime, so a plain module-level check (evaluated
// once, safely `false` during SSR) avoids the extra render an effect-based check would cause.
const CLIPBOARD_SUPPORTED =
  typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

export function ClipboardLinkDetector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState<{ url: string; networkLabel: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackedUrl: string; shopName: string } | null>(null);

  async function handleCheckClipboard() {
    setOpen(true);
    setChecked(false);
    setResult(null);
    setError(null);

    try {
      const text = await navigator.clipboard.readText();
      const dismissKey = DISMISSED_KEY_PREFIX + text;

      const networkLabel = text ? quickGuessNetworkLabel(text) : null;

      if (!text || sessionStorage.getItem(dismissKey) || !networkLabel) {
        setCandidate(null);
      } else {
        setCandidate({ url: text, networkLabel });
      }
    } catch {
      setCandidate(null);
      setError("Không thể đọc clipboard. Hãy cấp quyền truy cập clipboard cho trình duyệt.");
    } finally {
      setChecked(true);
    }
  }

  function close() {
    if (candidate) {
      sessionStorage.setItem(DISMISSED_KEY_PREFIX + candidate.url, "1");
    }
    setOpen(false);
    setCandidate(null);
    setChecked(false);
    setError(null);
  }

  async function handleActivate() {
    if (!candidate) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/affiliate/paste-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: candidate.url }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không thể tạo liên kết hoàn tiền");
      return;
    }

    setResult({ trackedUrl: data.trackedUrl, shopName: data.shop?.name ?? candidate.networkLabel });
    router.refresh();
  }

  if (!CLIPBOARD_SUPPORTED) return null;

  return (
    <>
      {!open && (
        <button
          onClick={handleCheckClipboard}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg transition-transform hover:scale-105 md:bottom-6"
          aria-label="Kiểm tra clipboard để nhận hoàn tiền"
        >
          📋
        </button>
      )}

      {open && (
        <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-surface p-4 shadow-lg md:bottom-6 md:right-6 md:left-auto md:mx-0">
          {!checked && (
            <p className="text-sm text-muted-foreground">Đang kiểm tra clipboard...</p>
          )}

          {checked && !candidate && !result && (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground">
                  {error ??
                    "Không tìm thấy link sản phẩm nào trong clipboard. Copy link Shopee, Lazada, Tiki, TikTok Shop hoặc ShopeeFood rồi thử lại."}
                </p>
                <button
                  onClick={close}
                  aria-label="Đóng"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </>
          )}

          {checked && candidate && !result && (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground">
                  📋 Phát hiện link <strong>{candidate.networkLabel}</strong> trong clipboard.
                  Nhận hoàn tiền ngay?
                </p>
                <button
                  onClick={close}
                  aria-label="Đóng"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {loading ? "Đang tạo liên kết..." : "Nhận hoàn tiền"}
                </button>
                <button
                  onClick={close}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-surface-muted"
                >
                  Bỏ qua
                </button>
              </div>
            </>
          )}

          {result && (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground">
                  ✅ Đã tạo liên kết hoàn tiền cho <strong>{result.shopName}</strong>!
                </p>
                <button
                  onClick={close}
                  aria-label="Đóng"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <a
                href={result.trackedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
                onClick={close}
              >
                Mở liên kết & mua ngay
              </a>
            </>
          )}
        </div>
      )}
    </>
  );
}
