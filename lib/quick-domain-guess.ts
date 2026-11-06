/**
 * Client-safe, best-effort guess of which marketplace a URL belongs to, based on hostname only
 * — no redirect-following (that requires a server-side fetch to avoid CORS, see
 * lib/link-detect.ts's detectNetworkFromUrl, which is the source of truth used when the link is
 * actually submitted to /api/affiliate/paste-link).
 *
 * Used only for the optimistic "Phát hiện link X trong clipboard" preview text before the user
 * taps to confirm — if this guess is wrong or the URL is a shortener we can't resolve client-side
 * (e.g. vt.tiktok.com), the server-side detection on submit is still authoritative and will
 * either succeed correctly or surface the real error.
 */
const QUICK_LABELS: { pattern: RegExp; label: string }[] = [
  { pattern: /(^|\.)shopeefood\.vn$/i, label: "ShopeeFood" },
  { pattern: /(^|\.)shopee\.(vn|com)$/i, label: "Shopee" },
  { pattern: /(^|\.)shp\.ee$/i, label: "Shopee" },
  { pattern: /(^|\.)lazada\.(vn|com)$/i, label: "Lazada" },
  { pattern: /(^|\.)tiki\.vn$/i, label: "Tiki" },
  { pattern: /(^|\.)(shop\.)?tiktok\.com$/i, label: "TikTok Shop" },
  { pattern: /(^|\.)vt\.tiktok\.com$/i, label: "TikTok Shop" },
];

export function quickGuessNetworkLabel(rawUrl: string): string | null {
  try {
    const { hostname } = new URL(rawUrl);
    return QUICK_LABELS.find((r) => r.pattern.test(hostname))?.label ?? null;
  } catch {
    return null;
  }
}
