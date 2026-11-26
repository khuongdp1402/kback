import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless bearer token for the Zalo Mini App. The Mini App runs inside Zalo's webview on a
 * Zalo-owned origin, so NextAuth's cookie session can't be used there — instead, after
 * /api/zalo/auth verifies the Zalo access token, we hand back this HMAC-signed token and the
 * Mini App sends it as `Authorization: Bearer <token>` on every call.
 *
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, AUTH_SECRET)).
 * Blocked users are still rejected on every request (see requireZaloUser), so a stolen or
 * stale token stops working as soon as an admin blocks the account.
 */

const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

interface TokenPayload {
  sub: string;
  exp: number;
  /** Audience marker so a token minted here can never be confused with another HMAC token. */
  aud: "zalo-miniapp";
}

function getSecret(): string {
  const secret = (process.env.AUTH_SECRET ?? "").trim();
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createZaloSessionToken(userId: string): { token: string; expiresAt: number } {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload: TokenPayload = { sub: userId, exp, aud: "zalo-miniapp" };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, expiresAt: exp * 1000 };
}

export function verifyZaloSessionToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
    if (payload.aud !== "zalo-miniapp" || typeof payload.sub !== "string") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
