import { NextResponse } from "next/server";
import { verifyKieWebhookSignature } from "@/lib/kie/verify-webhook";
import { completeVideoClip } from "@/lib/video/complete-clip";

/**
 * Inbound callback endpoint for kie.ai's Kling image-to-video jobs. Point each clip's
 * callBackUrl at:
 *   POST https://<your-domain>/api/webhooks/kie-video
 *
 * See lib/kie/verify-webhook.ts for the HMAC verification caveat — the header name/signing
 * scheme is an assumption pending a real webhook delivery to confirm against.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-kie-signature");

  if (!verifyKieWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Chữ ký webhook không hợp lệ" }, { status: 401 });
  }

  const body = JSON.parse(rawBody || "null");
  const taskId: string | undefined = body?.data?.taskId ?? body?.taskId;
  const state: string | undefined = body?.data?.state ?? body?.state;

  if (!taskId || !state) {
    return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
  }

  if (state === "success") {
    const resultJson = body?.data?.resultJson ?? body?.resultJson;
    const clipUrl = extractVideoUrl(resultJson);
    if (!clipUrl) {
      return NextResponse.json({ error: "Không tìm thấy videoUrl trong payload" }, { status: 400 });
    }
    await completeVideoClip(taskId, { status: "COMPLETED", clipUrl });
  } else if (state === "fail") {
    const failMsg = body?.data?.failMsg ?? body?.failMsg ?? "kie.ai báo lỗi";
    await completeVideoClip(taskId, { status: "FAILED", errorMessage: failMsg });
  }

  return NextResponse.json({ ok: true });
}

function extractVideoUrl(resultJson: unknown): string | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const obj = resultJson as Record<string, unknown>;
  const urls = obj.resultUrls ?? obj.video_urls ?? obj.videos;
  if (Array.isArray(urls) && typeof urls[0] === "string") return urls[0];
  if (typeof obj.url === "string") return obj.url;
  return null;
}
