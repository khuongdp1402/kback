/**
 * Minimal Telegram Bot API client. Uses fetch directly against api.telegram.org — no SDK needed
 * for the small surface this bot uses (sendMessage + webhook registration + Mini App button).
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

export function getBotUsername(): string | undefined {
  return process.env.TELEGRAM_BOT_USERNAME?.trim() || undefined;
}

export function getAppPublicUrl(): string {
  return (process.env.APP_PUBLIC_URL?.trim() || "https://kback-app.vercel.app").replace(/\/+$/, "");
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: Array<
    Array<{
      text: string;
      url?: string;
      web_app?: { url: string };
    }>
  >;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: "Markdown" | "HTML";
    disableWebPagePreview?: boolean;
    replyMarkup?: TelegramInlineKeyboardMarkup;
  },
) {
  const token = getBotToken();
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode ?? "Markdown",
    disable_web_page_preview: options?.disableWebPagePreview ?? false,
  };
  if (options?.replyMarkup) {
    payload.reply_markup = options.replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }

  return response.json();
}

export async function setTelegramWebhook(webhookUrl: string) {
  const token = getBotToken();
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      ...(secretToken ? { secret_token: secretToken } : {}),
    }),
  });
  return response.json();
}

export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number; first_name?: string; username?: string };
  };
}
