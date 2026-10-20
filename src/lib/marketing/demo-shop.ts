/**
 * Stable ClipperQ Demo shop slug for marketing / OA rich menu.
 * Override with NEXT_PUBLIC_DEMO_SHOP_SLUG in each environment.
 * Prod seed: supabase/scripts/seed_clipperq_demo_prod.sql (slug clipperqdemo).
 */
export const DEFAULT_DEMO_SHOP_SLUG = "clipperqdemo";

export const DEMO_SHOP_DISPLAY_NAME = "ClipperQ Demo";

export function getDemoShopSlug(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG?.trim();
  return fromEnv || DEFAULT_DEMO_SHOP_SLUG;
}

export function demoShopBookingPath(): string {
  return `/${getDemoShopSlug()}`;
}

/** Public read-only board entry (not staff admin). */
export function demoShopBoardPath(): string {
  return "/demo/board";
}

export function demoShopBookingsPath(): string {
  return `/${getDemoShopSlug()}/bookings`;
}

export function isDemoShopSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() === getDemoShopSlug().toLowerCase();
}
