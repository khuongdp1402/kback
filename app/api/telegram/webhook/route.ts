import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAppPublicUrl,
  sendTelegramMessage,
  type TelegramInlineKeyboardMarkup,
  type TelegramUpdate,
} from "@/lib/telegram";
import { createAffiliateLinkForUser } from "@/lib/create-affiliate-link";
import { getWalletSummary } from "@/lib/wallet";
import { formatVnd } from "@/lib/format";

const URL_PATTERN = /https?:\/\/\S+/i;

function miniAppKeyboard(path = "/dashboard", label = "📱 Mở KBack App"): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: label,
          web_app: { url: `${getAppPublicUrl()}${path}` },
        },
      ],
    ],
  };
}

/**
 * Telegram webhook entry point — Telegram POSTs every update (message, etc.) here.
 * Handles two things:
 *   1. `/start <code>` — links this Telegram chat to a KBack account via the one-time code
 *      issued at /telegram in the dashboard.
 *   2. Any message containing a URL — treated as a paste-link request, same flow as the web
 *      "Dán link sản phẩm" form, but the user must already be linked (step 1) for it to work.
 *
 * Register this URL with Telegram once via `setTelegramWebhook` (see lib/telegram.ts) or the
 * `/api/telegram/register` helper route after deploying — Telegram will not know to call this
 * endpoint until that's done.
 */
export async function POST(request: Request) {
  // Optional shared-secret check: Telegram echoes back X-Telegram-Bot-Api-Secret-Token if
  // configured when registering the webhook. If TELEGRAM_WEBHOOK_SECRET is set, enforce it.
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (expectedSecret) {
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token")?.trim();
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim();

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (text.startsWith("/start")) {
      await handleStart(chatId, text);
    } else if (text === "/vi" || text === "/wallet") {
      await handleWalletCommand(chatId);
    } else if (URL_PATTERN.test(text)) {
      await handlePasteLink(chatId, text);
    } else {
      await sendTelegramMessage(
        chatId,
        "Gửi cho mình một link sản phẩm (Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood) để nhận link hoàn tiền, hoặc gõ /vi để xem số dư ví.",
      );
    }
  } catch (err) {
    console.error("[telegram webhook] error handling update", err);
    await sendTelegramMessage(chatId, "Có lỗi xảy ra, vui lòng thử lại sau.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

async function handleStart(chatId: number, text: string) {
  const code = text.replace("/start", "").trim();

  if (!code) {
    await sendTelegramMessage(
      chatId,
      "Chào mừng đến với KBack Bot! 👋\n\nĐể liên kết tài khoản, vào https://kback-app.vercel.app/telegram khi đã đăng nhập, lấy mã 6 số rồi gửi cho mình dạng: /start 123456",
    );
    return;
  }

  const linkCode = await prisma.telegramLinkCode.findUnique({
    where: { code },
    include: { user: true },
  });

  if (!linkCode || linkCode.usedAt || linkCode.expiresAt < new Date()) {
    await sendTelegramMessage(
      chatId,
      "Mã liên kết không hợp lệ hoặc đã hết hạn. Vào lại https://kback-app.vercel.app/telegram để lấy mã mới.",
    );
    return;
  }

  const chatIdStr = String(chatId);

  // If this Telegram chat was previously linked to a different account, detach it first —
  // telegramChatId is unique, so re-linking to a new account requires clearing the old one.
  await prisma.user.updateMany({
    where: { telegramChatId: chatIdStr },
    data: { telegramChatId: null },
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: linkCode.userId },
      data: { telegramChatId: chatIdStr },
    }),
    prisma.telegramLinkCode.update({
      where: { id: linkCode.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await sendTelegramMessage(
    chatId,
    `✅ Đã liên kết thành công với tài khoản *${linkCode.user.email}*!\n\nGửi link sản phẩm bất kỳ để nhận link hoàn tiền, hoặc gõ /vi để xem số dư ví.`,
    { replyMarkup: miniAppKeyboard("/dashboard", "📱 Mở KBack Mini App") },
  );
}

async function handleWalletCommand(chatId: number) {
  const user = await requireLinkedUser(chatId);
  if (!user) return;

  const wallet = await getWalletSummary(user.id);
  await sendTelegramMessage(
    chatId,
    `💰 *Ví KBack*\n\nSố dư khả dụng: ${formatVnd(wallet.availableBalance)}\nChờ xác nhận: ${formatVnd(wallet.pendingBalance)}\nĐã rút: ${formatVnd(wallet.paidOut)}`,
    { replyMarkup: miniAppKeyboard("/wallet", "💳 Mở Ví & Rút tiền") },
  );
}

async function handlePasteLink(chatId: number, text: string) {
  const user = await requireLinkedUser(chatId);
  if (!user) return;

  const match = text.match(URL_PATTERN);
  const url = match?.[0];
  if (!url) return;

  const result = await createAffiliateLinkForUser(user.id, url);

  if (!result.ok) {
    const message =
      result.error === "unrecognized"
        ? "Chưa hỗ trợ sàn này. Hiện chỉ nhận link từ Shopee, Lazada, Tiki, TikTok Shop và ShopeeFood."
        : "Sàn này chưa được cấu hình trên hệ thống.";
    await sendTelegramMessage(chatId, message);
    return;
  }

  await sendTelegramMessage(
    chatId,
    `${result.shopEmoji} Đã nhận diện *${result.shopName}*!\n\nMua qua link này để nhận hoàn tiền:\n${result.trackedUrl}`,
    { disableWebPagePreview: true },
  );
}

async function requireLinkedUser(chatId: number) {
  const user = await prisma.user.findUnique({ where: { telegramChatId: String(chatId) } });
  if (!user) {
    await sendTelegramMessage(
      chatId,
      "Bạn chưa liên kết tài khoản KBack. Vào https://kback-app.vercel.app/telegram khi đã đăng nhập để lấy mã liên kết.",
    );
    return null;
  }
  if (user.isBlocked) {
    await sendTelegramMessage(chatId, "Tài khoản của bạn đã bị khoá. Liên hệ hỗ trợ để biết thêm.");
    return null;
  }
  return user;
}
