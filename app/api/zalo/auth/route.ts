import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyZaloAccessToken } from "@/lib/zalo/verify-access-token";
import { findOrCreateZaloUser } from "@/lib/zalo/users";
import { createZaloSessionToken } from "@/lib/zalo/session";
import { zaloJson, zaloPreflight } from "@/lib/zalo/http";

const bodySchema = z.object({ accessToken: z.string().trim().min(1).max(4096) });

export function OPTIONS(request: Request) {
  return zaloPreflight(request);
}

/**
 * Zalo Mini App sign-in: exchanges a Zalo user access token (zmp-sdk getAccessToken()) for a
 * KBack bearer token. Creates the KBack account on first open — no email/password form, which
 * is the whole point of meeting customers inside Zalo.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`zalo-auth:${getClientIp(request)}`, 20, 60 * 1000);
  if (!limit.allowed) {
    return zaloJson(
      request,
      { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return zaloJson(request, { error: "Thiếu access token Zalo" }, { status: 400 });
  }

  const profile = await verifyZaloAccessToken(parsed.data.accessToken);
  if (!profile) {
    return zaloJson(request, { error: "Không xác thực được tài khoản Zalo" }, { status: 401 });
  }

  const user = await findOrCreateZaloUser(profile);
  if (user.isBlocked) {
    return zaloJson(request, { error: "Tài khoản của bạn đã bị khoá. Liên hệ hỗ trợ." }, { status: 403 });
  }

  const { token, expiresAt } = createZaloSessionToken(user.id);
  return zaloJson(request, {
    token,
    expiresAt,
    user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
  });
}
