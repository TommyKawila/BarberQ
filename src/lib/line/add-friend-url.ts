import { shopIsDemo } from "@/lib/demo/demo-shop-guards";
import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";

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
 * Platform global OA add-friend URL is only for demo / Founder QA pilot shops.
 * Real shops without oa_basic_id must hide the button (null).
 */
export function allowsPlatformAddFriendFallback(shop: {
  slug: string;
  is_demo?: boolean | null;
}): boolean {
  if (shopIsDemo({ slug: shop.slug, is_demo: shop.is_demo ?? undefined })) {
    return true;
  }
  const slug = shop.slug.trim().toLowerCase();
  return slug === FOUNDER_QA_MANIFEST.shop.slug.toLowerCase();
}

/**
 * Prefer the shop's own OA basicId. Optionally fall back to
 * NEXT_PUBLIC_LINE_OA_ADD_URL for demo/test shops only.
 */
export function resolveShopAddFriendUrl(opts: {
  oaBasicId?: string | null;
  globalFallback?: string | null;
  /** When false/omitted, never use the platform OA URL. */
  allowGlobalFallback?: boolean;
}): string | null {
  const fromShop = buildLineAddFriendUrl(opts.oaBasicId);
  if (fromShop) return fromShop;
  if (!opts.allowGlobalFallback) return null;
  const fallback = opts.globalFallback?.trim() ?? "";
  return fallback || null;
}
