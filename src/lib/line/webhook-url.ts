export function shopLineWebhookUrl(shopId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/api/line/webhook/${shopId}`;
}

/**
 * Build the per-shop LINE setup invite email from CLIPPERQ_SETUP_EMAIL.
 * Inserts `+<shopId>` immediately before `@` (even if the base local-part
 * already has a `+` tag). Returns null when the env is missing or blank.
 */
export function shopLineSetupEmail(shopId: string): string | null {
  const raw = process.env.CLIPPERQ_SETUP_EMAIL?.trim();
  if (!raw) return null;
  const at = raw.lastIndexOf("@");
  if (at <= 0) return null;
  return `${raw.slice(0, at)}+${shopId}${raw.slice(at)}`;
}
