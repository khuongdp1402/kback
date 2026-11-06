import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireAdminSession } from "@/lib/require-admin";
import { createKieTask } from "@/lib/kie/client";
import { pollKieTaskUntilDone } from "@/lib/kie/poll-task";
import { KIE_MODELS } from "@/lib/kie/models";
import { getStorageProvider } from "@/lib/storage";

const bodySchema = z.object({
  description: z.string().min(1),
  /**
   * Reference product photo (e.g. the garment on a hanger/flat-lay) to edit from. Required —
   * google/nano-banana-edit is an image-EDITING model, not text-to-image; it rejects an empty
   * image_urls array with a 500 ("image_urls is required").
   */
  referenceImageUrl: z.string().url(),
  angle: z.enum(["front", "side", "back", "closeup"]).default("front"),
});

const ANGLE_PROMPTS: Record<string, string> = {
  front: "full-body front view, standing pose, studio lighting, plain neutral background",
  side: "full-body side profile view, standing pose, studio lighting, plain neutral background",
  back: "full-body back view showing the outfit's back design, studio lighting, plain neutral background",
  closeup: "close-up shot focused on fabric texture and details, studio lighting, plain neutral background",
};

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const { description, referenceImageUrl, angle } = parsed.data;
  const prompt =
    `A young Asian female fashion model wearing: ${description}. ${ANGLE_PROMPTS[angle]}. ` +
    `Photorealistic, high quality product photography.`;

  try {
    const { taskId } = await createKieTask(KIE_MODELS.imageEdit, {
      prompt,
      image_urls: [referenceImageUrl],
      output_format: "png",
      aspect_ratio: "3:4",
    });

    const record = await pollKieTaskUntilDone(taskId);
    if (record.state === "fail") {
      return NextResponse.json(
        { error: record.failMsg ?? "kie.ai sinh ảnh thất bại" },
        { status: 502 },
      );
    }

    const resultUrl = extractImageUrl(record.resultJson);
    if (!resultUrl) {
      return NextResponse.json({ error: "Không tìm thấy ảnh kết quả từ kie.ai" }, { status: 502 });
    }

    // Re-host the kie.ai output on our own storage so it doesn't depend on kie.ai's URL lifetime.
    const imageRes = await fetch(resultUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const { url } = await getStorageProvider().putObject({
      key: `products/ai/${randomUUID()}.png`,
      data: buffer,
      contentType: "image/png",
    });

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định khi gọi kie.ai" },
      { status: 502 },
    );
  }
}

/** kie.ai's resultJson shape varies per model — nano-banana-edit returns an image URL array. */
function extractImageUrl(resultJson: unknown): string | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const obj = resultJson as Record<string, unknown>;
  const urls = obj.resultUrls ?? obj.image_urls ?? obj.images;
  if (Array.isArray(urls) && typeof urls[0] === "string") return urls[0];
  if (typeof obj.url === "string") return obj.url;
  return null;
}
