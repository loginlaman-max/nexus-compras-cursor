import { createHmac, timingSafeEqual } from "crypto";

export function verifyBlingWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  clientSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=") || !clientSecret) return false;
  const expected = createHmac("sha256", clientSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice(7);
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}
