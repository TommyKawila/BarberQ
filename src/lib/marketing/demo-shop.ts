/**
 * Stable ClipperQ Demo shop slug for marketing / OA rich menu.
 * Override with NEXT_PUBLIC_DEMO_SHOP_SLUG in each environment.
 * Local memory-store seed defaults to phinxstudio.
 */
export const DEFAULT_DEMO_SHOP_SLUG = "phinxstudio";

export function getDemoShopSlug(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG?.trim();
  return fromEnv || DEFAULT_DEMO_SHOP_SLUG;
}

export function demoShopBookingPath(): string {
  return `/${getDemoShopSlug()}`;
}

export function demoShopBoardPath(): string {
  return `/${getDemoShopSlug()}/admin`;
}

export function demoShopBookingsPath(): string {
  return `/${getDemoShopSlug()}/bookings`;
}
