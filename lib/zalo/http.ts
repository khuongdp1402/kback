import { prisma } from "@/lib/prisma";
import { verifyZaloSessionToken } from "./session";

/**
 * CORS for /api/zalo/* — the Mini App is served from a Zalo-owned origin, not ours. Auth uses a
 * bearer token (no cookies), so a wildcard origin is safe by default; set
 * ZALO_MINIAPP_ALLOWED_ORIGINS (comma-separated) to lock it down once you know the exact origins
 * your Mini App is served from.
 */
function allowedOrigin(request: Request): string {
  const configured = (process.env.ZALO_MINIAPP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (configured.length === 0) return "*";
  const origin = request.headers.get("origin") ?? "";
  return configured.includes(origin) ? origin : configured[0];
}

export function corsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(request),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function zaloJson(request: Request, body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: { ...corsHeaders(request), ...init?.headers },
  });
}

export function zaloPreflight(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** Resolves the signed-in Mini App user from the bearer token, or null (→ respond 401). */
export async function requireZaloUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const userId = verifyZaloSessionToken(header.slice(7).trim());
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isBlocked) return null;
  return user;
}

export const UNAUTHORIZED_BODY = { error: "Phiên đăng nhập đã hết hạn, vui lòng mở lại Mini App." };
