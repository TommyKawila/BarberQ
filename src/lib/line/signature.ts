import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyLineSignature(
  body: string | Buffer,
  channelSecret: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader || !channelSecret) return false;
  const digest = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
