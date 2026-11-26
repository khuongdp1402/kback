import { createHmac } from "crypto";

export interface ZaloProfile {
  /** App-scoped Zalo user id. */
  id: string;
  name: string;
  avatarUrl?: string;
}

const GRAPH_BASE = (process.env.ZALO_GRAPH_API_BASE_URL ?? "https://graph.zalo.me").replace(/\/+$/, "");

/**
 * Verifies a Zalo Mini App user access token (obtained client-side via zmp-sdk
 * `getAccessToken()`) by calling Zalo's Graph API `/me`, and returns the user's profile.
 * The Mini App never sends us a user id directly — we only trust what Zalo returns for the token.
 *
 * ⚠️ CHƯA VERIFY VỚI APP THẬT: endpoint/header format below follows Zalo's public docs
 * ("Lấy thông tin người dùng" — GET graph.zalo.me/v2.0/me with `access_token` header and an
 * optional `appsecret_proof` = HMAC-SHA256(access_token, app secret)). Test once with a real
 * Mini App token before launch; adjust field names here only if Zalo's response differs.
 *
 * Dev shortcut: with ZALO_AUTH_MOCK=true (ignored in production), a token of the form
 * `mock:<id>:<name>` is accepted without calling Zalo, so the Mini App backend can be exercised
 * locally before a Zalo app id is approved.
 */
export async function verifyZaloAccessToken(accessToken: string): Promise<ZaloProfile | null> {
  if (
    process.env.ZALO_AUTH_MOCK === "true" &&
    process.env.NODE_ENV !== "production" &&
    accessToken.startsWith("mock:")
  ) {
    const [, id, name] = accessToken.split(":");
    if (!id) return null;
    return { id: `mock-${id}`, name: name || "Người dùng Zalo" };
  }

  const headers: Record<string, string> = { access_token: accessToken };
  const appSecret = process.env.ZALO_APP_SECRET?.trim();
  if (appSecret) {
    headers.appsecret_proof = createHmac("sha256", appSecret).update(accessToken).digest("hex");
  }

  let response: Response;
  try {
    response = await fetch(`${GRAPH_BASE}/v2.0/me?fields=id,name,picture`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error("[zalo] graph /me request failed", err);
    return null;
  }

  const data = (await response.json().catch(() => null)) as {
    id?: string | number;
    name?: string;
    picture?: { data?: { url?: string } };
    error?: number;
    message?: string;
  } | null;

  if (!response.ok || !data || (data.error && data.error !== 0) || !data.id) {
    console.warn("[zalo] access token rejected", response.status, data?.error, data?.message);
    return null;
  }

  return {
    id: String(data.id),
    name: data.name?.trim() || "Người dùng Zalo",
    avatarUrl: data.picture?.data?.url,
  };
}
