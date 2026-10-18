export const BARBERQX_BRAND = {
  name: "ClipperQ",
  pronunciation: "คลิปเปอร์คิว",
  /** Approved ClipperQ amber */
  gold: "#F6AD34",
  ink: "#111111",
  cream: "#F3EEE3",
  assets: {
    // New ClipperQ vectors (preferred)
    iconDark: "/brand/clipperq/icon-dark-transparent.svg",
    iconCream: "/brand/clipperq/icon-cream-transparent.svg",
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

export function clipperqIconSrc(surface: "dark" | "light" = "dark") {
  return surface === "dark"
    ? BARBERQX_BRAND.assets.iconCream
    : BARBERQX_BRAND.assets.iconDark;
}

export function clipperqWordmarkSrc(surface: "dark" | "light" = "dark") {
  return surface === "dark"
    ? BARBERQX_BRAND.assets.wordmarkCream
    : BARBERQX_BRAND.assets.wordmarkDark;
}
