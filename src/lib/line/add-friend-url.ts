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
 * Prefer the shop's own OA basicId. Fall back to the platform global URL
 * (NEXT_PUBLIC_LINE_OA_ADD_URL) for demo/test shops without a linked channel.
 */
export function resolveShopAddFriendUrl(opts: {
  oaBasicId?: string | null;
  globalFallback?: string | null;
}): string | null {
  const fromShop = buildLineAddFriendUrl(opts.oaBasicId);
  if (fromShop) return fromShop;
  const fallback = opts.globalFallback?.trim() ?? "";
  return fallback || null;
}
