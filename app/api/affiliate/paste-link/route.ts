import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAffiliateLinkForUser } from "@/lib/create-affiliate-link";

const bodySchema = z.object({
  url: z.string().min(1, "Vui lòng nhập đường dẫn sản phẩm"),
});

/**
 * Accepts any product/share URL the user pastes in, detects which marketplace it belongs to
 * from the domain, and returns a tracked affiliate link for that marketplace — same underlying
 * flow as picking a shop from the catalog, just entry point is a free-form URL instead.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
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
    if (result.error === "unrecognized") {
      return NextResponse.json(
        {
          error:
            "Chưa hỗ trợ sàn này. Hiện chỉ nhận link từ Shopee, Lazada, Tiki, TikTok Shop và ShopeeFood.",
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Sàn này chưa được cấu hình trên hệ thống" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    trackedUrl: result.trackedUrl,
    shop: { name: result.shopName, logoEmoji: result.shopEmoji },
  });
}
