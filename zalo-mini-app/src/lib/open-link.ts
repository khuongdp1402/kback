import { openOutApp, openWebview } from "zmp-sdk/apis";

/**
 * Opens the tracked affiliate link. Inside Zalo we use the documented openWebview (full screen);
 * marketplace universal links (Shopee/Lazada/TikTok) can then hand off to the merchant's own app.
 * Outside Zalo (browser dev) we fall back to window.open.
 */
export async function openTrackedLink(url: string) {
  try {
    await openWebview({ url, config: { style: "normal" } });
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

/** Secondary action: open in the system browser so the marketplace app can take over. */
export async function openInBrowser(url: string) {
  try {
    await openOutApp({ url });
  } catch {
    await openTrackedLink(url);
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export async function readClipboardUrl(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    const match = text.match(/https?:\/\/\S+/i);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}
