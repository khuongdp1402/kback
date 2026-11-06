import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBotUsername } from "@/lib/telegram";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Issues a fresh one-time 6-digit code the user sends to the bot as `/start <code>` to link
 * their Telegram chat to their KBack account. Old unused codes for this user are invalidated
 * so only the latest one is valid — avoids a stale code from an earlier page load being reused.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  await prisma.telegramLinkCode.deleteMany({
    where: { userId: session.user.id, usedAt: null },
  });

  let code = generateCode();
  // Extremely unlikely to collide (1M possibilities), but guard against it anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.telegramLinkCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateCode();
  }

  await prisma.telegramLinkCode.create({
    data: {
      code,
      userId: session.user.id,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  const botUsername = getBotUsername();

  return NextResponse.json({
    code,
    expiresInSeconds: CODE_TTL_MS / 1000,
    botDeepLink: botUsername ? `https://t.me/${botUsername}?start=${code}` : null,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramChatId: true },
  });

  return NextResponse.json({ linked: Boolean(user?.telegramChatId) });
}
