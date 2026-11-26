import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAffiliateLinkForUser, LINK_ERROR_MESSAGES } from "@/lib/create-affiliate-link";
import { getAppPublicUrl } from "@/lib/telegram";
import { requireZaloUser, UNAUTHORIZED_BODY, zaloJson, zaloPreflight } from "@/lib/zalo/http";

const bodySchema = z.object({
  url: z.string().trim().min(1, "Vui lòng nhập đường dẫn sản phẩm").max(2048),
});

export function OPTIONS(request: Request) {
  return zaloPreflight(request);
}

/** Creates a tracked cashback link for the signed-in Mini App user (same flow as web/Telegram). */
export async function POST(request: Request) {
  const user = await requireZaloUser(request);
  if (!user) return zaloJson(request, UNAUTHORIZED_BODY, { status: 401 });

  const limit = checkRateLimit(`paste-link:${user.id}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return zaloJson(
      request,
      { error: "Bạn tạo liên kết quá nhanh. Vui lòng thử lại sau ít giây." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return zaloJson(request, { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const result = await createAffiliateLinkForUser(user.id, parsed.data.url);
  if (!result.ok) {
    return zaloJson(request, { error: LINK_ERROR_MESSAGES[result.error] }, { status: 422 });
  }

  // Mock provider returns a relative /demo-checkout URL — the Mini App is on another origin, so
  // make it absolute against the public app URL.
  const trackedUrl = result.trackedUrl.startsWith("/")
    ? `${getAppPublicUrl()}${result.trackedUrl}`
    : result.trackedUrl;

  return zaloJson(request, {
    trackedUrl,
    shop: { name: result.shopName, logoEmoji: result.shopEmoji },
    estimate: result.estimate,
  });
}
