"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kback:pwa-install-dismissed-v1";

function subscribeNoop() {
  return () => {};
}

function getClientPwaState(): "hidden" | "ios-safari" | "eligible" {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || localStorage.getItem(DISMISS_KEY)) {
    return "hidden";
  }
  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
  return isIos && isSafari ? "ios-safari" : "eligible";
}

function getServerPwaState(): "hidden" | "ios-safari" | "eligible" {
  return "hidden";
}

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: app works normally without service worker.
      });
    }
  }, []);

  return null;
}

export function PwaInstallBanner() {
  const pwaState = useSyncExternalStore(subscribeNoop, getClientPwaState, getServerPwaState);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pwaState !== "eligible") return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [pwaState]);

  const showIosHint = pwaState === "ios-safari";
  if (dismissed || pwaState === "hidden" || (!deferredPrompt && !showIosHint)) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-light/70 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">Cài KBack lên màn hình chính</p>
        {deferredPrompt ? (
          <p className="text-xs text-muted-foreground">
            Mở nhanh như app native và hỗ trợ chia sẻ link trực tiếp từ Shopee, Lazada, TikTok Shop.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Trên Safari: bấm biểu tượng <strong>Chia sẻ (Share)</strong> →{" "}
            <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex h-8 items-center justify-center rounded-full bg-brand px-3.5 text-xs font-medium text-white hover:bg-brand-dark"
          >
            Cài ngay
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng thông báo cài đặt"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
