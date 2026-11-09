/**
 * Build a LINE "Add friend" deep link from an OA basicId (e.g. `@myshop`).
 * Messaging API GET /v2/bot/info returns basicId; we store it as oa_basic_id.
 */
export function buildLineAddFriendUrl(
  basicId: string | null | undefined,
): string | null {
  const raw = basicId?.trim();
  if (!raw) return null;
  const withAt = raw.startsWith("@") ? raw : `@${raw}`;
  // LINE basic IDs are @ + alphanumeric / underscore / hyphen / dot
  if (!/^@[A-Za-z0-9._-]+$/.test(withAt)) return null;
  return `https://line.me/R/ti/p/${withAt}`;
}

/**
 * Shop add-friend URL from that shop's own OA basicId only.
 * No platform OA fallback — missing basicId hides the button (demo/test included).
 */
export function resolveShopAddFriendUrl(opts: {
  oaBasicId?: string | null;
}): string | null {
  return buildLineAddFriendUrl(opts.oaBasicId);
}
