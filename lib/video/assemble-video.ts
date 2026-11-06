import { writeFile, mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Runs once all VideoClips for a GeneratedVideo are COMPLETED: concatenates the clips in
 * sequence order, muxes in the uploaded background-music track (if any), and uploads the final
 * file via the storage abstraction.
 *
 * Requires ffmpeg, which does not run reliably on Vercel serverless — this is meant to run via
 * `npm run assemble-worker` (scripts/assemble-worker.ts) on a machine with ffmpeg available,
 * polling the same database the deployed app writes to. Calling it directly from a serverless
 * request handler will fail or time out.
 */
export async function assembleVideo(videoId: string): Promise<void> {
  const video = await prisma.generatedVideo.findUnique({
    where: { id: videoId },
    include: { clips: { orderBy: { sequence: "asc" } } },
  });
  if (!video) return;

  await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: "RENDERING" } });

  const workDir = await mkdtemp(path.join(tmpdir(), "kback-video-"));

  try {
    const clipPaths: string[] = [];
    for (const clip of video.clips) {
      if (!clip.clipUrl) throw new Error(`Clip ${clip.sequence} thiếu clipUrl`);
      const res = await fetch(clip.clipUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const clipPath = path.join(workDir, `clip-${clip.sequence}.mp4`);
      await writeFile(clipPath, buffer);
      clipPaths.push(clipPath);
    }

    const concatPath = path.join(workDir, "concat.mp4");
    await concatClips(clipPaths, concatPath);

    let finalPath = concatPath;
    if (video.musicUrl) {
      const musicRes = await fetch(video.musicUrl);
      const musicBuffer = Buffer.from(await musicRes.arrayBuffer());
      const musicPath = path.join(workDir, "music.mp3");
      await writeFile(musicPath, musicBuffer);
      finalPath = path.join(workDir, "final.mp4");
      await muxAudio(concatPath, musicPath, finalPath);
    }

    const finalBuffer = await readFile(finalPath);
    const { url } = await getStorageProvider().putObject({
      key: `videos/${videoId}.mp4`,
      data: finalBuffer,
      contentType: "video/mp4",
    });

    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: { status: "COMPLETED", finalVideoUrl: url, completedAt: new Date() },
    });
  } catch (err) {
    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Lỗi không xác định khi ghép video",
      },
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function concatClips(clipPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    for (const p of clipPaths) command.input(p);
    command
      .on("error", reject)
      .on("end", () => resolve())
      .mergeToFile(outputPath, path.dirname(outputPath));
  });
}

function muxAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions(["-c:v copy", "-c:a aac", "-shortest"])
      .on("error", reject)
      .on("end", () => resolve())
      .save(outputPath);
  });
}
