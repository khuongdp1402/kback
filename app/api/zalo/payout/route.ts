import { requestPayout } from "@/lib/payout/request-payout";
import { requireZaloUser, UNAUTHORIZED_BODY, zaloJson, zaloPreflight } from "@/lib/zalo/http";

export function OPTIONS(request: Request) {
  return zaloPreflight(request);
}

/** Withdraw from the Mini App — Zalo-only accounts have no web password, so this must exist here. */
export async function POST(request: Request) {
  const user = await requireZaloUser(request);
  if (!user) return zaloJson(request, UNAUTHORIZED_BODY, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = await requestPayout(user.id, body);
  if (!result.ok) {
    return zaloJson(
      request,
      { error: result.error },
      {
        status: result.status,
        headers: result.retryAfterSec ? { "Retry-After": String(result.retryAfterSec) } : undefined,
      },
    );
  }
  return zaloJson(request, { payoutRequest: { id: result.payoutRequest.id, status: result.payoutRequest.status } }, { status: 201 });
}
