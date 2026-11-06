import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { assembleVideo } from "@/lib/video/assemble-video";

/**
 * Local worker for the ffmpeg render step that can't run on serverless hosts (see
 * lib/video/assemble-video.ts). Run this on any machine with ffmpeg available, pointed at the
 * SAME DATABASE_URL as the deployed app (e.g. Vercel) — it polls for GeneratedVideo rows whose
 * clips are all done but haven't been rendered yet, and renders them here.
 *
 * Usage: npm run assemble-worker
 */

const POLL_INTERVAL_MS = 10_000;

async function pollOnce() {
  const candidates = await prisma.generatedVideo.findMany({
    where: { status: "GENERATING_CLIPS" },
    include: { clips: true },
  });

  for (const video of candidates) {
    if (video.clips.length === 0) continue;
    const allDone = video.clips.every((c) => c.status === "COMPLETED");
    if (!allDone) continue;

    console.log(`[assemble-worker] Rendering video ${video.id} (${video.clips.length} clips)...`);
    try {
      await assembleVideo(video.id);
      console.log(`[assemble-worker] Video ${video.id} done.`);
    } catch (err) {
      console.error(`[assemble-worker] Video ${video.id} failed:`, err);
    }
  }
}

async function main() {
  console.log(`[assemble-worker] Polling every ${POLL_INTERVAL_MS / 1000}s. Ctrl+C to stop.`);
  for (;;) {
    await pollOnce().catch((err) => console.error("[assemble-worker] Poll error:", err));
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
