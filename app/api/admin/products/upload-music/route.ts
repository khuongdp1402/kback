import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminSession } from "@/lib/require-admin";
import { getStorageProvider } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"]);
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file nhạc" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Chỉ chấp nhận MP3 hoặc WAV" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File nhạc vượt quá 20MB" }, { status: 400 });
  }

  const ext = file.type.includes("wav") ? "wav" : "mp3";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { url } = await getStorageProvider().putObject({
    key: `music/${randomUUID()}.${ext}`,
    data: buffer,
    contentType: file.type,
  });

  return NextResponse.json({ url });
}
