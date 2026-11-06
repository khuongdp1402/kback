import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createKieTask } from "@/lib/kie/client";
import { KIE_MODELS } from "@/lib/kie/models";

const CLIP_LENGTH_SECONDS = 5;
const CLIP_PROMPTS = [
  "walking slowly toward the camera, confident smile, natural gentle movement, no distortion",
  "turning slightly to show the outfit from a different angle, subtle natural movement",
  "smiling at the camera, gentle hair movement, relaxed natural pose",
  "walking away slightly then turning back, smooth natural movement",
  "playful pose adjusting the outfit, natural smile, minimal movement",
  "close interaction with camera, confident finishing pose, minimal movement",
];

/**
 * Kicks off one kling-2.6/image-to-video job per clip, all using the SAME approved
 * modelImageUrl as the first frame — this is the consistency strategy from the plan (one high
 * quality model image, reused across every clip, instead of a different image per clip) to
 * avoid face/outfit drift between clips.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { videoId } = await params;
  const video = await prisma.generatedVideo.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: "Không tìm thấy video" }, { status: 404 });
  if (!video.modelImageUrl) {
    return NextResponse.json({ error: "Chưa có ảnh người mẫu — tạo ảnh trước" }, { status: 400 });
  }

  const clipCount = Math.ceil(video.durationSeconds / CLIP_LENGTH_SECONDS);
  const appUrl = process.env.APP_PUBLIC_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "Thiếu APP_PUBLIC_URL trong .env — cần URL public để kie.ai gọi webhook về" },
      { status: 500 },
    );
  }
  const callBackUrl = `${appUrl}/api/webhooks/kie-video`;

  await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: "GENERATING_CLIPS" } });

  const clips = [];
  for (let sequence = 0; sequence < clipCount; sequence++) {
    const prompt = CLIP_PROMPTS[sequence % CLIP_PROMPTS.length];
    try {
      const { taskId } = await createKieTask(
        KIE_MODELS.imageToVideo,
        {
          prompt,
          image_urls: [video.modelImageUrl],
          sound: false,
          duration: "5",
        },
        callBackUrl || undefined,
      );
      const clip = await prisma.videoClip.create({
        data: { videoId, sequence, externalTaskId: taskId, status: "GENERATING_CLIPS" },
      });
      clips.push(clip);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      await prisma.videoClip.create({
        data: { videoId, sequence, status: "FAILED", errorMessage: message },
      });
      await prisma.generatedVideo.update({
        where: { id: videoId },
        data: { status: "FAILED", errorMessage: `Clip ${sequence} không tạo được: ${message}` },
      });
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  return NextResponse.json({ clips });
}
