export const BARBERQX_BRAND = {
  name: "ClipperQ",
  pronunciation: "คลิปเปอร์คิว",
  /** Approved ClipperQ amber */
  gold: "#F6AD34",
  amber: "#F6AD34",
  ink: "#111111",
  cream: "#F3EEE3",
  /** Raised surface on Ink (cards, secondary buttons) */
  charcoal: "#2A2622",
  /** Cards / nav bar between Ink and Charcoal */
  surface: "#1F1C19",
  muted: "#B9B0A2",
  subtle: "#A39A8C",
  outline: "#857C70",
  destructive: "#B42318",
  /** Error text on dark surfaces */
  danger: "#F97066",
  /** LINE-not-linked chip (Tommy-approved orange, not Amber) */
  warningChip: "#FB923C",
  /** Amber Deep — text on light backgrounds (never amber #F6AD34 text on light). */
  amberDeep: "#8A5300",
  assets: {
    // New ClipperQ vectors (preferred)
    iconDark: "/brand/clipperq/icon-dark-transparent.svg",
    iconCream: "/brand/clipperq/icon-cream-transparent.svg",
    /** Brand Guide small mark ≤48px (Q ring + solid amber tail, no clipper). */
    smallMarkDark: "/brand/clipperq/clipperq-small-mark-dark.svg",
    smallMarkCream: "/brand/clipperq/clipperq-small-mark-cream.svg",
    smallMarkDark48Png: "/brand/clipperq/small-mark-dark-48.png",
    wordmarkDark: "/brand/clipperq/wordmark-dark-transparent.svg",
    wordmarkCream: "/brand/clipperq/wordmark-cream-transparent.svg",
    lockupDark: "/brand/clipperq/lockup-dark.svg",
    lockupCream: "/brand/clipperq/lockup-cream.svg",
    favicon32: "/brand/clipperq/favicon-32.png",
    appleTouchIcon: "/brand/clipperq/apple-touch-icon.png",
    icon192: "/brand/clipperq/icon-192.png",
    icon512: "/brand/clipperq/icon-512.png",
    maskable512: "/brand/clipperq/maskable-512.png",
    og: "/brand/clipperq/og.png",
    appIconDark: "/brand/clipperq/app-icon-dark.png",
    markCream64: "/brand/clipperq/mark-cream-64.png",
    // Legacy BarberQx PNGs kept on disk (unused)
    logoHorizontalDark: "/brand/barberqx/logo-horizontal-dark.png",
    logoHorizontalLight: "/brand/barberqx/logo-horizontal-light.png",
    markGold: "/brand/barberqx/mark-gold.png",
    markWhite: "/brand/barberqx/mark-white.png",
  },
} as const;

/** `surface` = background behind the logo. Dark UI → cream artwork; light UI → dark artwork. */
export function clipperqLockupSrc(surface: "dark" | "light" = "dark") {
  return surface === "dark"
    ? BARBERQX_BRAND.assets.lockupCream
    : BARBERQX_BRAND.assets.lockupDark;
}

/**
 * Icon artwork by rendered size.
 * ≤48px → small mark (legible at favicon / header mini).
 * ≥49px → full icon (clipper detail).
 */
export function clipperqIconSrc(surface: "dark" | "light" = "dark", sizePx = 64) {
  if (sizePx <= 48) {
    return surface === "dark"
      ? BARBERQX_BRAND.assets.smallMarkCream
      : BARBERQX_BRAND.assets.smallMarkDark;
  }
  return surface === "dark"
    ? BARBERQX_BRAND.assets.iconCream
    : BARBERQX_BRAND.assets.iconDark;
}

export function clipperqWordmarkSrc(surface: "dark" | "light" = "dark") {
  return surface === "dark"
    ? BARBERQX_BRAND.assets.wordmarkCream
    : BARBERQX_BRAND.assets.wordmarkDark;
}

/**
 * Absolute HTTPS URL for the small-mark PNG used in LINE Flex.
 * Returns null when APP_URL is missing, non-https, or clearly local/placeholder
 * so Flex builders can fall back to text-only attribution.
 */
export function clipperqFlexSmallMarkUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!/^https:\/\//i.test(raw)) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "example.com" ||
      host.endsWith(".local") ||
      host.includes("placeholder")
    ) {
      return null;
    }
    return `${u.origin}${BARBERQX_BRAND.assets.smallMarkDark48Png}`;
  } catch {
    return null;
  }
}
