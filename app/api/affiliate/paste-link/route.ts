import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAffiliateLinkForUser, LINK_ERROR_MESSAGES } from "@/lib/create-affiliate-link";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  url: z.string().trim().min(1, "Vui lòng nhập đường dẫn sản phẩm").max(2048),
});

/**
 * Accepts any product/share URL the user pastes in, detects which marketplace it belongs to
 * from the domain, and returns a tracked affiliate link for that marketplace plus an estimate of
 * the cashback at the user's current tier — same underlying flow as picking a shop from the
 * catalog, just entry point is a free-form URL instead.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const limit = checkRateLimit(`paste-link:${session.user.id}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Bạn tạo liên kết quá nhanh. Vui lòng thử lại sau ít giây." },
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

  const result = await createAffiliateLinkForUser(session.user.id, parsed.data.url);

  if (!result.ok) {
    return NextResponse.json({ error: LINK_ERROR_MESSAGES[result.error] }, { status: 422 });
  }

  return NextResponse.json({
    trackedUrl: result.trackedUrl,
    shop: { name: result.shopName, logoEmoji: result.shopEmoji },
    estimate: result.estimate,
  });
}
