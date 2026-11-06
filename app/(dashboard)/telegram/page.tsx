import { TelegramLinkCard } from "@/components/telegram-link-card";

export default function TelegramPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Telegram Bot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Liên kết tài khoản để dán link và nhận hoàn tiền ngay trong Telegram.
        </p>
      </div>
      <TelegramLinkCard />
    </div>
  );
}
