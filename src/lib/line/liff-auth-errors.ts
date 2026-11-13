/**
 * Map LIFF / LINE Login SDK errors to Thai UX copy.
 * Never surface raw English SDK strings (e.g. "The access token expired").
 */

const FALLBACK_TH =
  "เข้าสู่ระบบ LINE ไม่สำเร็จ กรุณาลองใหม่";

const EXPIRED_TH =
  "เซสชัน LINE หมดอายุแล้ว กรุณาล็อกอินอีกครั้ง";

/** Shop admin: LINE logged in but not staff for this shop. */
export const ADMIN_NO_SHOP_ACCESS_TH =
  "บัญชี LINE นี้ไม่มีสิทธิ์เข้าหลังบ้านร้านนี้";

const THAI_CHAR = /[\u0E00-\u0E7F]/;

export function isExpiredLiffTokenError(err: unknown): boolean {
  const msg = messageOf(err).toLowerCase();
  return (
    msg.includes("access token expired") ||
    msg.includes("token expired") ||
    msg.includes("expired access token")
  );
}

export function isAdminNotAuthorizedError(err: unknown): boolean {
  const msg = messageOf(err).trim().toLowerCase();
  return msg === "not authorized" || msg.includes("not authorized");
}

export function thaiLiffAuthError(err: unknown): string {
  if (isExpiredLiffTokenError(err)) return EXPIRED_TH;
  if (isAdminNotAuthorizedError(err)) return ADMIN_NO_SHOP_ACCESS_TH;
  const msg = messageOf(err).trim();
  if (!msg) return FALLBACK_TH;
  // Always keep messages that already contain Thai characters
  // (e.g. "LINE …" Thai copy that starts with Latin letters).
  if (THAI_CHAR.test(msg)) return msg;
  // Replace English SDK / network noise.
  if (
    /^[A-Za-z]/.test(msg) ||
    /\b(liff|token|login|init|failed|error|unauthorized)\b/i.test(msg)
  ) {
    return FALLBACK_TH;
  }
  return msg;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message ?? "";
  if (typeof err === "string") return err;
  return "";
}
