import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { estimateForUrl } from "@/lib/estimate-for-url";
import { requireZaloUser, zaloJson, zaloPreflight } from "@/lib/zalo/http";

const bodySchema = z.object({
  url: z.string().trim().min(1, "Vui lòng nhập đường dẫn sản phẩm").max(2048),
});

export function OPTIONS(request: Request) {
  return zaloPreflight(request);
}

/** Cashback estimate for a pasted link — works signed-in (own tier) or not (new-member rate). */
export async function POST(request: Request) {
  const limit = checkRateLimit(`zalo-estimate:${getClientIp(request)}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return zaloJson(
      request,
      { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return zaloJson(request, { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const user = await requireZaloUser(request);
  const result = await estimateForUrl(parsed.data.url, user?.id);
  if (!result.ok) {
    return zaloJson(request, { error: result.error }, { status: 422 });
  }
  return zaloJson(request, { estimate: result.estimate });
}
