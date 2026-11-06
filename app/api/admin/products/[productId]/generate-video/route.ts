import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const bodySchema = z.object({
  durationSeconds: z.number().int().min(5).max(30).default(10),
  musicUrl: z.string().url().optional(),
});

const CLIP_LENGTH_SECONDS = 5;

/**
 * Requires GeneratedVideo.modelImageUrl to already be set (via /regenerate-model-image) before
 * calling — this route only kicks off the Kling image-to-video clips, not the model image step,
 * so the admin can review/retry the model image cheaply before paying for video generation.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { productId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });

  const { durationSeconds, musicUrl } = parsed.data;
  const clipCount = Math.ceil(durationSeconds / CLIP_LENGTH_SECONDS);

  const video = await prisma.generatedVideo.create({
    data: {
      productId,
      status: "GENERATING_MODEL_IMAGE",
      durationSeconds: clipCount * CLIP_LENGTH_SECONDS,
      musicUrl,
    },
  });

  return NextResponse.json({ video, clipCount });
}
