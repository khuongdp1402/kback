import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies an inbound kie.ai webhook call using the account's Webhook HMAC Key (kie.ai
 * dashboard -> Webhook HMAC Key). kie.ai's exact header name/signing scheme isn't published in
 * the docs pages reachable at implementation time — this assumes the common convention (raw
 * request body HMAC-SHA256'd with the key, hex-encoded, sent in an `X-Kie-Signature` header).
 * VERIFY against a real webhook delivery once KIE_WEBHOOK_HMAC_KEY is set, and adjust the
 * header name/encoding here if kie.ai's actual payload differs.
 *
 * Returns true (skips verification) when KIE_WEBHOOK_HMAC_KEY is unset, so local dev without a
 * configured key doesn't hard-fail — set the key before relying on this for anything real.
 */
export function verifyKieWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const key = process.env.KIE_WEBHOOK_HMAC_KEY;
  if (!key) return true;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", key).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
