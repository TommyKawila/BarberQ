/**
 * Map LIFF / LINE Login SDK errors to Thai UX copy.
 * Never surface raw English SDK strings (e.g. "The access token expired").
 */

const FALLBACK_TH =
  "เข้าสู่ระบบ LINE ไม่สำเร็จ กรุณาลองใหม่";

const EXPIRED_TH =
  "เซสชัน LINE หมดอายุแล้ว กรุณาล็อกอินอีกครั้ง";

export function isExpiredLiffTokenError(err: unknown): boolean {
  const msg = messageOf(err).toLowerCase();
  return (
    msg.includes("access token expired") ||
    msg.includes("token expired") ||
    msg.includes("expired access token")
  );
}

export function thaiLiffAuthError(err: unknown): string {
  if (isExpiredLiffTokenError(err)) return EXPIRED_TH;
  const msg = messageOf(err).trim();
  if (!msg) return FALLBACK_TH;
  // Keep already-Thai messages; replace English SDK / network noise.
  if (/[A-Za-z]/.test(msg[0] ?? "") || /\b(liff|token|login|init|failed|error|unauthorized)\b/i.test(msg)) {
    return FALLBACK_TH;
  }
  return msg;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message ?? "";
  if (typeof err === "string") return err;
  return "";
}
