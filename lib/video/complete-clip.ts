import { prisma } from "@/lib/prisma";

/**
 * Marks a single VideoClip as finished (success or failure) by its kie.ai externalTaskId. Called
 * from the kie.ai webhook route, which runs on the deployed app (e.g. Vercel) — it deliberately
 * does NOT trigger assembleVideo() itself, since that needs ffmpeg which serverless hosts can't
 * run reliably. Once every clip for a GeneratedVideo is COMPLETED, the video is left in
 * GENERATING_CLIPS status for scripts/assemble-worker.ts (run on a machine with ffmpeg,
 * pointed at the same DATABASE_URL) to pick up and render.
 */
export async function completeVideoClip(
  externalTaskId: string,
  result: { status: "COMPLETED"; clipUrl: string } | { status: "FAILED"; errorMessage: string },
): Promise<void> {
  const clip = await prisma.videoClip.findUnique({ where: { externalTaskId } });
  if (!clip) return;

  await prisma.videoClip.update({
    where: { id: clip.id },
    data:
      result.status === "COMPLETED"
        ? { status: "COMPLETED", clipUrl: result.clipUrl }
        : { status: "FAILED", errorMessage: result.errorMessage },
  });

  if (result.status === "FAILED") {
    await prisma.generatedVideo.update({
      where: { id: clip.videoId },
      data: { status: "FAILED", errorMessage: `Clip ${clip.sequence} thất bại: ${result.errorMessage}` },
    });
  }
}
