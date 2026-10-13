/** Marketing product screens captured via Playwright (390×844 @2x → WebP). */
export const marketingScreens = {
  landing: "/marketing/screens/shop-landing.webp",
  choose: "/marketing/screens/choose-slot.webp",
  summary: "/marketing/screens/booking-summary.webp",
  ticket: "/marketing/screens/queue-ticket.webp",
  adminQueue: "/marketing/screens/admin-queue.webp",
  adminTeam: "/marketing/screens/admin-team.webp",
} as const;

export type MarketingScreenKey = keyof typeof marketingScreens;

/** Hand-holding-phone photo slot — owner supplies green-screen asset. */
export const handPhoneAsset = {
  src: "/marketing/hand-phone.webp",
  /** Percent coords of the blank green screen within the photo (tweak when asset arrives). */
  screen: {
    top: "14%",
    left: "29%",
    width: "42%",
    height: "55%",
    borderRadius: "12% / 8%",
  },
} as const;
