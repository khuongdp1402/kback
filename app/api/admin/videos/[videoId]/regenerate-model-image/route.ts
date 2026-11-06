import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createKieTask } from "@/lib/kie/client";
import { pollKieTaskUntilDone } from "@/lib/kie/poll-task";
import { KIE_MODELS } from "@/lib/kie/models";

/**
 * (Re)generates the model-wearing-the-outfit image for a GeneratedVideo. Kept separate from
 * generate-video so the admin can retry the image (cheap) as many times as needed before paying
 * for the more expensive Kling clip generation.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { videoId } = await params;
  const video = await prisma.generatedVideo.findUnique({
    where: { id: videoId },
    include: { product: true },
  });
  if (!video) return NextResponse.json({ error: "Không tìm thấy video" }, { status: 404 });

  await prisma.generatedVideo.update({
    where: { id: videoId },
    data: { status: "GENERATING_MODEL_IMAGE", errorMessage: null },
  });

  const prompt =
    `A young Asian female fashion model wearing this exact outfit from the reference image: ` +
    `${video.product.description || video.product.name}. Full body, standing pose, ` +
    `photorealistic, studio lighting, plain neutral background, natural proportions, ` +
    `anatomically correct hands and face.`;

  try {
    const { taskId } = await createKieTask(KIE_MODELS.imageEdit, {
      prompt,
      image_urls: [video.product.imageUrl],
      output_format: "png",
      aspect_ratio: "9:16",
    });

    const record = await pollKieTaskUntilDone(taskId);
    if (record.state === "fail") {
      await prisma.generatedVideo.update({
        where: { id: videoId },
        data: { status: "FAILED", errorMessage: record.failMsg ?? "Tạo ảnh người mẫu thất bại" },
      });
      return NextResponse.json({ error: record.failMsg ?? "Thất bại" }, { status: 502 });
    }

    const modelImageUrl = extractImageUrl(record.resultJson);
    if (!modelImageUrl) {
      await prisma.generatedVideo.update({
        where: { id: videoId },
        data: { status: "FAILED", errorMessage: "Không tìm thấy ảnh kết quả từ kie.ai" },
      });
      return NextResponse.json({ error: "Không tìm thấy ảnh kết quả" }, { status: 502 });
    }

    const updated = await prisma.generatedVideo.update({
      where: { id: videoId },
      data: { status: "PENDING", modelImageUrl },
    });

    return NextResponse.json({ video: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: { status: "FAILED", errorMessage: message },
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function extractImageUrl(resultJson: unknown): string | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const obj = resultJson as Record<string, unknown>;
  const urls = obj.resultUrls ?? obj.image_urls ?? obj.images;
  if (Array.isArray(urls) && typeof urls[0] === "string") return urls[0];
  if (typeof obj.url === "string") return obj.url;
  return null;
}
