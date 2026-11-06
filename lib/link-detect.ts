import type { ShopNetwork } from "@/app/generated/prisma/enums";

/**
 * Maps a pasted product/share URL's hostname to one of our supported marketplace networks,
 * so the "paste a link" flow can look up the matching Shop record and build an affiliate
 * deep link for it — without the user having to pick a shop manually.
 */
const DOMAIN_RULES: { pattern: RegExp; network: ShopNetwork }[] = [
  { pattern: /(^|\.)shopeefood\.vn$/i, network: "SHOPEEFOOD" },
  { pattern: /(^|\.)shopee\.(vn|com)$/i, network: "SHOPEE" },
  { pattern: /(^|\.)shp\.ee$/i, network: "SHOPEE" },
  { pattern: /(^|\.)lazada\.(vn|com)$/i, network: "LAZADA" },
  { pattern: /(^|\.)tiki\.vn$/i, network: "TIKI" },
  { pattern: /(^|\.)(shop\.)?tiktok\.com$/i, network: "TIKTOK" },
];

/**
 * Hostnames known to be link shorteners that redirect to the real product page on a different
 * domain — AccessTrade's campaigns validate against the FINAL merchant domain, so a shortener
 * URL like vt.tiktok.com must be resolved to its real tiktok.com/shop.tiktok.com destination
 * before we can even detect the network, let alone create a deep link. Confirmed empirically:
 * AccessTrade rejects vt.tiktok.com links with "The link is not part of the campaign" even
 * though the campaign is TikTok Shop — it only recognizes the resolved domain.
 */
const SHORTENER_HOSTS = [/(^|\.)vt\.tiktok\.com$/i, /(^|\.)shp\.ee$/i];

export interface DetectedLink {
  network: ShopNetwork;
  normalizedUrl: string;
}

export class UnrecognizedLinkError extends Error {
  constructor(url: string) {
    super(`Không nhận diện được sàn TMĐT từ liên kết: ${url}`);
    this.name = "UnrecognizedLinkError";
  }
}

function isShortener(hostname: string): boolean {
  return SHORTENER_HOSTS.some((p) => p.test(hostname));
}

/**
 * Follows HTTP redirects for known shortener domains to find the real product URL. Uses a GET
 * with redirect: "manual" per hop (rather than "follow") so we can cap the hop count safely and
 * avoid hanging on a redirect loop — shortener chains are normally 1-2 hops.
 */
async function resolveShortener(url: string, maxHops = 5): Promise<string> {
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
    const response = await fetch(current, { method: "HEAD", redirect: "manual" });
    const location = response.headers.get("location");
    if (!location) return current;
    current = new URL(location, current).toString();
    const { hostname } = new URL(current);
    if (!isShortener(hostname)) return current;
  }
  return current;
}

export async function detectNetworkFromUrl(rawUrl: string): Promise<DetectedLink> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnrecognizedLinkError(rawUrl);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnrecognizedLinkError(rawUrl);
  }

  if (isShortener(parsed.hostname)) {
    try {
      const resolved = await resolveShortener(parsed.toString());
      parsed = new URL(resolved);
    } catch {
      // Resolution failed (network error, unexpected host) — fall through and let the normal
      // domain-rule check below reject it with the standard "unrecognized" error.
    }
  }

  const rule = DOMAIN_RULES.find((r) => r.pattern.test(parsed.hostname));
  if (!rule) {
    throw new UnrecognizedLinkError(rawUrl);
  }

  return { network: rule.network, normalizedUrl: normalizeForNetwork(rule.network, parsed) };
}

/**
 * TikTok's in-app "Share → Copy link" button appends short-lived session/security params
 * (checksum, encode_params, share_link_id, ...) that break once the URL is redirected through
 * an affiliate tracking chain (KBack → AccessTrade → TikTok) — verified empirically: the same
 * product URL with its query string stripped resolves fine, the full share link 404s partway
 * through the redirect chain. Product identity lives entirely in the path (e.g.
 * /view/product/{id} or /pdp/.../{id}), so dropping the query string is safe and fixes it.
 * Other networks (Tiki's ?spid=, etc.) keep their query string — it can be load-bearing there.
 */
function normalizeForNetwork(network: ShopNetwork, parsed: URL): string {
  if (network === "TIKTOK") {
    return `${parsed.origin}${parsed.pathname}`;
  }
  return parsed.toString();
}
