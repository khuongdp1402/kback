import { authorize, getAccessToken } from "zmp-sdk/apis";

const API_BASE = (import.meta.env.VITE_KBACK_API_URL || "https://kback-app.vercel.app").replace(/\/+$/, "");

/** Mirrors lib/cashback-rate.ts CashbackEstimate on the backend. */
export interface CashbackEstimate {
  shopName: string;
  shopEmoji: string;
  network: string;
  userRate: number;
  topTierRate: number;
  tierLabel: string;
  settlement: string;
  examples: { orderAmount: number; cashback: number }[];
}

export interface SessionUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface MeResponse {
  user: SessionUser;
  wallet: { confirmedBalance: number; pendingBalance: number; paidOut: number; availableBalance: number };
  minPayoutAmount: number;
  membership: {
    label: string;
    sharePercent: number;
    totalSpend: number;
    nextLabel: string | null;
    amountToNextTier: number;
  };
  transactions: {
    id: string;
    shopName: string;
    shopEmoji: string;
    orderAmount: number;
    cashbackAmount: number;
    status: string;
    statusLabel: string;
    createdAt: string;
  }[];
  payouts: { id: string; amount: number; bankName: string; status: string; statusLabel: string; createdAt: string }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let sessionToken: string | null = null;

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("Không kết nối được máy chủ KBack. Kiểm tra mạng và thử lại.", 0);
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new ApiError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại.", res.status);
  }
  return data;
}

/**
 * Signs the Zalo user into KBack. No form: Zalo already knows who they are.
 * 1. Ask (once, non-blocking) for scope.userInfo so we can show their Zalo name/avatar —
 *    declining is fine, the account still works with just the Zalo id.
 * 2. getAccessToken() → backend verifies it with Zalo Graph API → returns our bearer token.
 */
export async function signInWithZalo(): Promise<SessionUser> {
  let accessToken: string | undefined;
  try {
    await authorize({ scopes: ["scope.userInfo"] }).catch(() => undefined);
    accessToken = await getAccessToken();
  } catch {
    accessToken = undefined;
  }

  // Running in a normal browser during development (no Zalo container).
  if (!accessToken) {
    accessToken = import.meta.env.VITE_ZALO_DEV_MOCK_TOKEN || undefined;
  }
  if (!accessToken) {
    throw new ApiError("Không lấy được thông tin Zalo. Vui lòng mở KBack từ ứng dụng Zalo.", 401);
  }

  const data = await request<{ token: string; user: SessionUser }>("/api/zalo/auth", {
    method: "POST",
    body: { accessToken },
  });
  sessionToken = data.token;
  return data.user;
}

export const api = {
  estimate: (url: string) =>
    request<{ estimate: CashbackEstimate }>("/api/zalo/estimate", { method: "POST", body: { url } }),
  createLink: (url: string) =>
    request<{ trackedUrl: string; shop: { name: string; logoEmoji: string }; estimate: CashbackEstimate }>(
      "/api/zalo/paste-link",
      { method: "POST", body: { url } },
    ),
  me: () => request<MeResponse>("/api/zalo/me"),
  payout: (body: { amount: number; bankName: string; bankAccountNumber: string; bankAccountName: string }) =>
    request<{ payoutRequest: { id: string; status: string } }>("/api/zalo/payout", { method: "POST", body }),
};

export function formatVnd(n: number) {
  return `${Math.round(n).toLocaleString("vi-VN")}₫`;
}
