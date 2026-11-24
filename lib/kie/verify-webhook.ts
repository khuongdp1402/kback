import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies an inbound kie.ai webhook call using HMAC-SHA256.
 * Fails closed in production if KIE_WEBHOOK_HMAC_KEY is missing.
 */
export function verifyKieWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const key = process.env.KIE_WEBHOOK_HMAC_KEY?.trim();
  if (!key) {
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", key).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader.trim(), "utf8");

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
