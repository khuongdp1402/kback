"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LinkCodeResponse {
  code: string;
  expiresInSeconds: number;
  botDeepLink: string | null;
}

export function TelegramLinkCard() {
  const [linked, setLinked] = useState<boolean | null>(null);
  const [data, setData] = useState<LinkCodeResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/telegram/link-code")
      .then((res) => res.json())
      .then((d) => setLinked(Boolean(d.linked)))
      .catch(() => setLinked(false));
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  async function handleGetCode() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/telegram/link-code", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Không thể tạo mã liên kết");
      return;
    }

    setData(body);
    setSecondsLeft(body.expiresInSeconds);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground">Telegram Bot</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dán link sản phẩm ngay trong Telegram để nhận link hoàn tiền, không cần mở web.
      </p>

      {linked === true && (
        <div className="mt-4 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
          ✅ Tài khoản của bạn đã liên kết với Telegram.
        </div>
      )}

      {linked === false && !data && (
        <Button onClick={handleGetCode} disabled={loading} className="mt-4">
          {loading ? "Đang tạo mã..." : "Lấy mã liên kết"}
        </Button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {data && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border bg-surface-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Mã liên kết của bạn</p>
            <p className="font-display tabular-nums mt-1 text-3xl font-semibold tracking-widest text-foreground">
              {data.code}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hết hạn sau {minutes}:{seconds}
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Mở Bot Telegram của KBack</li>
            <li>
              Gửi tin nhắn: <code className="rounded bg-surface-muted px-1.5 py-0.5">/start {data.code}</code>
            </li>
            <li>Bot xác nhận liên kết thành công là xong</li>
          </ol>
          {data.botDeepLink && (
            <a
              href={data.botDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Mở Bot Telegram
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
