import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { estimateForUrl } from "@/lib/estimate-for-url";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  url: z.string().trim().min(1, "Vui lòng nhập đường dẫn sản phẩm").max(2048),
});

/**
 * Public (no login required) cashback estimate for a pasted product link. Used by the landing
 * page so visitors see "bạn được hoàn ~X đ" before registering. Rate-limited per IP since it is
 * unauthenticated and may resolve shortener links server-side.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`estimate:${getClientIp(request)}`, 20, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const session = await auth();
  const result = await estimateForUrl(parsed.data.url, session?.user?.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ estimate: result.estimate });
}
