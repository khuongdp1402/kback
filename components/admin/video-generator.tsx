"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Clip {
  id: string;
  sequence: number;
  status: string;
  clipUrl: string | null;
  errorMessage: string | null;
}

interface Video {
  id: string;
  status: string;
  durationSeconds: number;
  modelImageUrl: string | null;
  musicUrl: string | null;
  finalVideoUrl: string | null;
  errorMessage: string | null;
  clips: Clip[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  affiliateDeepLink: string | null;
}

// Rough cost estimate per generation step — check kie.ai dashboard for exact live pricing.
// No per-video cost for background music since it's an upload, not an AI generation call.
const EST_MODEL_IMAGE_USD = 0.15;
const EST_CLIP_5S_USD = 0.8;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  GENERATING_MODEL_IMAGE: "Đang tạo ảnh người mẫu",
  GENERATING_CLIPS: "Đang tạo clip video",
  RENDERING: "Đang ghép video",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "default",
  GENERATING_MODEL_IMAGE: "warning",
  GENERATING_CLIPS: "warning",
  RENDERING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
};

export function VideoGenerator({
  product,
  initialVideos,
}: {
  product: Product;
  initialVideos: Video[];
}) {
  const router = useRouter();
  // Optimistically-created video not yet reflected in initialVideos (before the first
  // router.refresh() lands) — merged into the render list below, then superseded once the
  // server component re-fetches and includes it for real.
  const [pendingVideo, setPendingVideo] = useState<Video | null>(null);
  const videos = useMemo(() => {
    if (!pendingVideo) return initialVideos;
    const serverHasPending = initialVideos.some((v) => v.id === pendingVideo.id);
    return serverHasPending ? initialVideos : [pendingVideo, ...initialVideos];
  }, [pendingVideo, initialVideos]);

  const [durationSeconds, setDurationSeconds] = useState(10);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null);

  const clipCount = Math.ceil(durationSeconds / 5);
  const estimatedCostUsd = EST_MODEL_IMAGE_USD + clipCount * EST_CLIP_5S_USD;

  async function handleUploadMusic(file: File) {
    setUploadingMusic(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/products/upload-music", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setUploadingMusic(false);
    if (!res.ok) {
      setError(data.error ?? "Upload nhạc thất bại");
      return;
    }
    setMusicUrl(data.url);
  }

  // Poll for status updates while any video is still in-progress, since webhook completion has
  // no client push mechanism in this app (no websockets/SSE anywhere else in the codebase).
  useEffect(() => {
    const inProgress = videos.some((v) => !["COMPLETED", "FAILED"].includes(v.status));
    if (!inProgress) return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [videos, router]);

  async function handleCreateVideo() {
    setError(null);
    setCreating(true);
    const res = await fetch(`/api/admin/products/${product.id}/generate-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationSeconds, musicUrl: musicUrl || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Tạo video thất bại");
      return;
    }
    const created: Video = { ...data.video, clips: [] };
    setPendingVideo(created);
    router.refresh();

    // Kick off the model image step right away.
    await handleRegenerateModelImage(created.id, created);
  }

  async function handleRegenerateModelImage(videoId: string, base?: Video) {
    setError(null);
    setBusyVideoId(videoId);
    const res = await fetch(`/api/admin/videos/${videoId}/regenerate-model-image`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setBusyVideoId(null);
    if (!res.ok) {
      setError(data.error ?? "Tạo ảnh người mẫu thất bại");
      router.refresh();
      return;
    }
    const current = base ?? videos.find((v) => v.id === videoId);
    if (current) setPendingVideo({ ...current, ...data.video });
    router.refresh();
  }

  async function handleStartClips(videoId: string) {
    setError(null);
    setBusyVideoId(videoId);
    const res = await fetch(`/api/admin/videos/${videoId}/start-clips`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusyVideoId(null);
    if (!res.ok) {
      setError(data.error ?? "Bắt đầu tạo clip thất bại");
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Link affiliate</h2>
        {product.affiliateDeepLink ? (
          <p className="mt-2 break-all rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm text-foreground">
            {product.affiliateDeepLink}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Chưa có link affiliate.</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Tạo video mới</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Độ dài video
            </label>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            >
              <option value={10}>10 giây (2 clip — rẻ nhất)</option>
              <option value={15}>15 giây (3 clip)</option>
              <option value={20}>20 giây (4 clip)</option>
              <option value={30}>30 giây (6 clip)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nhạc nền (mp3/wav, tuỳ chọn — nên chọn bài đang trend TikTok)
            </label>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav"
              disabled={uploadingMusic}
              onChange={(e) => e.target.files?.[0] && handleUploadMusic(e.target.files[0])}
              className="text-sm text-muted-foreground"
            />
            {musicUrl && (
              <audio controls src={musicUrl} className="mt-2 h-9 w-full max-w-sm" />
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Chi phí ước tính: <span className="font-medium text-foreground">${estimatedCostUsd.toFixed(2)}</span>{" "}
          ({clipCount} clip × ~${EST_CLIP_5S_USD}/5s + ảnh người mẫu — số thật xem trong dashboard
          kie.ai)
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4">
          <Button disabled={creating} onClick={handleCreateVideo}>
            {creating ? "Đang khởi tạo..." : "Tạo video"}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {videos.map((video) => (
          <Card key={video.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[video.status] ?? "default"}>
                  {STATUS_LABEL[video.status] ?? video.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{video.durationSeconds}s</span>
              </div>
              {video.finalVideoUrl && (
                <a
                  href={video.finalVideoUrl}
                  download
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Tải video về
                </a>
              )}
            </div>

            {video.errorMessage && (
              <p className="mt-2 text-sm text-red-600">{video.errorMessage}</p>
            )}

            {video.modelImageUrl && (
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={video.modelImageUrl}
                  alt="model preview"
                  className="h-48 w-36 rounded-lg object-cover"
                />
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyVideoId === video.id}
                    onClick={() => handleRegenerateModelImage(video.id)}
                  >
                    {busyVideoId === video.id ? "Đang tạo lại..." : "Tạo lại ảnh"}
                  </Button>
                  {video.status === "PENDING" && (
                    <Button
                      size="sm"
                      disabled={busyVideoId === video.id}
                      onClick={() => handleStartClips(video.id)}
                    >
                      Ảnh ổn — Bắt đầu tạo video
                    </Button>
                  )}
                </div>
              </div>
            )}

            {video.clips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {video.clips.map((clip) => (
                  <Badge key={clip.id} tone={STATUS_TONE[clip.status] ?? "default"}>
                    Clip {clip.sequence + 1}: {STATUS_LABEL[clip.status] ?? clip.status}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
