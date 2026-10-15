/**
 * Sale-page photo slots — separate desktop/mobile art direction.
 * Drop WebP at `swapPath`, then set matching `src` (leave null for labeled placeholder).
 *
 * Specs (Tommy AI mockups):
 * - heroDesktop  2400×1350 16:9  subject on right, text over left
 * - heroMobile   1080×1350 4:5
 * - barberDesktop 960×1200
 * - barberMobile  1080×1350 4:5
 * - founder       1024×1024
 * - painBarber    1600×1200 4:3  stressed barber + phone notifications
 */
export type MarketingPhotoSlotId =
  | "heroDesktop"
  | "heroMobile"
  | "barberDesktop"
  | "barberMobile"
  | "founder"
  | "painBarber";

export type MarketingPhotoPairId = "hero" | "barber";

export type MarketingPhotoSlot = {
  id: MarketingPhotoSlotId;
  /** Public URL once ready; null = show placeholder. */
  src: string | null;
  /** Target path under /public for the swap. */
  swapPath: string;
  width: number;
  height: number;
  /** Short machine label baked into the placeholder UI. */
  label: string;
  /** Art-direction note for designers. */
  artNote: string;
};

export const marketingPhotoSlots: Record<MarketingPhotoSlotId, MarketingPhotoSlot> = {
  heroDesktop: {
    id: "heroDesktop",
    src: "/marketing/photos/hero-desktop.webp",
    swapPath: "/marketing/photos/hero-desktop.webp",
    width: 2400,
    height: 1350,
    label: "PHOTO SLOT · hero desktop 16:9",
      artNote: "2400×1350 · subject on right · phone screen = booking-confirmed (queue-ticket.webp)",
  },
  heroMobile: {
    id: "heroMobile",
    src: "/marketing/photos/hero-mobile.webp",
    swapPath: "/marketing/photos/hero-mobile.webp",
    width: 1080,
    height: 1350,
    label: "PHOTO SLOT · hero mobile 4:5",
      artNote: "1080×1350 · dark top for headline · phone screen = booking-confirmed (queue-ticket.webp)",
  },
  barberDesktop: {
    id: "barberDesktop",
    src: "/marketing/photos/barber-desktop.webp",
    swapPath: "/marketing/photos/barber-desktop.webp",
    width: 960,
    height: 1200,
    label: "PHOTO SLOT · barber desktop",
    artNote: "960×1200 · barber looking at queue board",
  },
  barberMobile: {
    id: "barberMobile",
    src: "/marketing/photos/barber-mobile.webp",
    swapPath: "/marketing/photos/barber-mobile.webp",
    width: 1080,
    height: 1350,
    label: "PHOTO SLOT · barber mobile 4:5",
    artNote: "1080×1350 · mobile crop of barber + board",
  },
  founder: {
    id: "founder",
    src: "/marketing/photos/founder.webp",
    swapPath: "/marketing/photos/founder.webp",
    width: 1024,
    height: 1024,
    label: "PHOTO SLOT · founder",
    artNote: "1024×1024 · Tommy looking at camera",
  },
  painBarber: {
    id: "painBarber",
    /** null until Tommy picks an option from docs/mockups/pain-point/ */
    src: null,
    swapPath: "/marketing/photos/pain-barber.webp",
    width: 1600,
    height: 1200,
    label: "PHOTO SLOT · pain barber 4:3",
    artNote:
      "1600×1200 · Thai barber mid-cut, clippers + phone flooded with chats, stressed · pick from docs/mockups/pain-point/",
  },
} as const;

/** Responsive pairs switch at the `lg` breakpoint. */
export const marketingPhotoPairs: Record<
  MarketingPhotoPairId,
  { desktop: MarketingPhotoSlotId; mobile: MarketingPhotoSlotId }
> = {
  hero: { desktop: "heroDesktop", mobile: "heroMobile" },
  barber: { desktop: "barberDesktop", mobile: "barberMobile" },
};
