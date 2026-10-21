/** Marketing product screens captured via Playwright (390×844 @2x → WebP). */
export const marketingScreens = {
  landing: "/marketing/screens/shop-landing.webp",
  choose: "/marketing/screens/choose-slot.webp",
  /** Compact how-it-works step 1: full BrandMark + extra status-bar breathing room. */
  chooseCompact: "/marketing/screens/choose-booking-v3.webp",
  summary: "/marketing/screens/booking-summary.webp",
  ticket: "/marketing/screens/queue-ticket.webp",
  /** Demo-shop sample queues (มิกซ์/โอ๊ต/เจ/นนท์) — v2 filenames bust stale CDN/image cache. */
  adminQueue: "/marketing/screens/admin-queue-demo.webp",
  /** Compact how-it-works step 3: grid-focused crop (full barber columns, no side clip). */
  adminQueueBoard: "/marketing/screens/admin-queue-board-demo.webp",
  adminTeam: "/marketing/screens/admin-team.webp",
  adminStats: "/marketing/screens/admin-stats-demo.webp",
} as const;

export type MarketingScreenKey = keyof typeof marketingScreens;

/**
 * Hand-holding-phone hero — green screen chroma-keyed + screenshot pre-composited.
 * Screens include an iOS status-bar safe area (~74pt) so shop chrome clears the island.
 * Mobile asset is a tight phone crop at ~1284w for iPhone DPR3.
 * Rebuild: `npm run prepare:marketing-visuals`
 */
export const handPhoneHero = {
  /** Original green-screen plate (owner asset). */
  source: "/marketing/hand-phone.webp",
  /** Full-res composite (screenshot under Dynamic Island). */
  composited: "/marketing/hero/hand-phone-composited.webp",
  /** Transparent hand+phone cutout for desktop right-column hero. */
  cutout: "/marketing/hero/hand-phone-cutout.webp",
  desktop: "/marketing/hero/hand-phone-desktop.webp",
  mobile: "/marketing/hero/hand-phone-mobile.webp",
  width: 1122,
  height: 1402,
  cutoutWidth: 580,
  cutoutHeight: 1065,
  desktopWidth: 720,
  desktopHeight: 900,
  /** Tight phone crop @ ~428×3 for mobile hero readability */
  mobileWidth: 1284,
  mobileHeight: 2735,
  /** Detected green-screen rect from chroma key (pixels @ source size). */
  screen: { minX: 376, minY: 234, maxX: 748, maxY: 1040, w: 373, h: 807 },
  island: { minX: 505, minY: 243, maxX: 620, maxY: 278 },
} as const;

/** @deprecated use handPhoneHero — kept for any leftover imports */
export const handPhoneAsset = {
  src: handPhoneHero.source,
  screen: {
    top: "16.7%",
    left: "33.5%",
    width: "33.2%",
    height: "57.6%",
    borderRadius: "12% / 6%",
  },
} as const;
