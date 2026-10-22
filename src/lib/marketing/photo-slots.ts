/**
 * Sale-page photo slots — Tommy drops WebP at `swapPath`, then set `src` to the same path.
 * People images stay `src: null` (gray Thai placeholder) until files land under /public/sale/.
 * Product UI screenshots (LINE reminder, queue board) stay real mockups — not these slots.
 *
 * Paths (single file per slot):
 * - /sale/pain-barber-cutting.webp
 * - /sale/solution-customer.webp
 * - /sale/solution-barber-calm.webp
 * - /sale/booking-success-barber.webp
 * - /marketing/photos/* (existing hero / board / founder)
 */
export type MarketingPhotoSlotId =
  | "heroDesktop"
  | "heroMobile"
  | "barberDesktop"
  | "barberMobile"
  | "founder"
  | "painBarber"
  | "solutionCustomer"
  | "solutionBarberCalm"
  | "bookingSuccessBarber";

export type MarketingPhotoPairId = "hero" | "barber";

export type MarketingPhotoSlot = {
  id: MarketingPhotoSlotId;
  /** Public URL once ready; null = show Thai placeholder. */
  src: string | null;
  /** Optional PNG (or other) fallback when `src` is a modern format like webp. */
  fallbackSrc?: string | null;
  /** Target path under /public for the drop-in file. */
  swapPath: string;
  width: number;
  height: number;
  /** Aspect ratio label, e.g. "4:5". */
  ratio: string;
  /**
   * Thai placeholder label shown in the gray box.
   * Format: shot description + ratio + px (e.g. รูปช่างเหนื่อย … 4:5 1080×1350).
   */
  labelTh: string;
  /** Short EN art-direction note (tests / designers). */
  artNote: string;
};

export const marketingPhotoSlots: Record<MarketingPhotoSlotId, MarketingPhotoSlot> = {
  heroDesktop: {
    id: "heroDesktop",
    src: "/marketing/photos/hero-desktop.webp",
    fallbackSrc: "/marketing/photos/hero-desktop.png",
    swapPath: "/marketing/photos/hero-desktop.webp",
    width: 1731,
    height: 909,
    ratio: "16:9",
    labelTh: "รูปฮีโร่เดสก์ท็อป 16:9 1731×909",
    artNote:
      "1731×909 · Tommy hero-composite · ClipperQ Demo booking-success B2 on phone · cover-crop from 1672×941 plate · hand+phone on right · dark left for copy · PNG fallback /marketing/photos/hero-desktop.png",
  },
  heroMobile: {
    id: "heroMobile",
    src: "/marketing/photos/hero-mobile.webp",
    fallbackSrc: "/marketing/photos/hero-mobile.png",
    swapPath: "/marketing/photos/hero-mobile.webp",
    width: 1080,
    height: 1350,
    ratio: "4:5",
    labelTh: "รูปฮีโร่มือถือ 4:5 1080×1350",
    artNote:
      "1080×1350 · 4:5 Tommy ClipperQ Demo hero plate (cover-crop from 1122×1402) · phone+hand fully visible · sits below copy (design C) · PNG fallback /marketing/photos/hero-mobile.png",
  },
  barberDesktop: {
    id: "barberDesktop",
    src: "/marketing/photos/barber-desktop.webp",
    fallbackSrc: "/marketing/photos/barber-desktop.png",
    swapPath: "/marketing/photos/barber-desktop.webp",
    width: 1672,
    height: 941,
    ratio: "16:9",
    labelTh: "รูปช่างชี้ iPad ที่เคาน์เตอร์ เดสก์ท็อป 16:9 1672×941",
    artNote:
      "1672×941 · Tommy barber-ipad plate as-is (blank black screen) · PNG fallback /marketing/photos/barber-desktop.png · screen mockup TBD after admin redesign",
  },
  barberMobile: {
    id: "barberMobile",
    src: "/marketing/photos/barber-mobile.webp",
    swapPath: "/marketing/photos/barber-mobile.webp",
    width: 1080,
    height: 1350,
    ratio: "4:5",
    labelTh: "รูปช่างดูบอร์ดคิว มือถือ 4:5 1080×1350",
    artNote: "1080×1350 · mobile crop of barber + board",
  },
  founder: {
    id: "founder",
    src: "/marketing/photos/founder.webp",
    swapPath: "/marketing/photos/founder.webp",
    width: 1024,
    height: 1024,
    ratio: "1:1",
    labelTh: "รูป Tommy ผู้สร้างระบบ 1:1 1024×1024",
    artNote: "1024×1024 · Tommy looking at camera",
  },
  painBarber: {
    id: "painBarber",
    src: "/sale/pain-barber-cutting.webp",
    fallbackSrc: "/sale/pain-barber-cutting.png",
    swapPath: "/sale/pain-barber-cutting.webp",
    width: 1122,
    height: 1402,
    ratio: "4:5",
    labelTh: "รูปช่างตัดผมถือกรรไกรไฟฟ้าและมือถือ 4:5 1122×1402",
    artNote:
      "1122×1402 · Tommy pain-barber-cutting (full frame) · clippers+customer left · phone right · PNG fallback /sale/pain-barber-cutting.png",
  },
  solutionCustomer: {
    id: "solutionCustomer",
    src: "/sale/solution-customer.webp",
    swapPath: "/sale/solution-customer.webp",
    width: 1080,
    height: 1080,
    ratio: "1:1",
    labelTh: "รูปลูกค้ายิ้มมองมือถืออ่านข้อความร้าน 1:1 1080×1080",
    artNote: "Customer smiling at phone reading shop LINE confirmation / reminder",
  },
  solutionBarberCalm: {
    id: "solutionBarberCalm",
    src: "/sale/solution-barber-calm.webp",
    swapPath: "/sale/solution-barber-calm.webp",
    width: 1920,
    height: 1080,
    ratio: "16:9",
    labelTh: "รูปช่างผ่อนคลายตัดผม มือถือวางข้างโชว์บอร์ดคิวจริง 16:9 1920×1080",
    artNote:
      "Relaxed barber cutting; phone beside shows real ClipperQ queue board (composite OK)",
  },
  bookingSuccessBarber: {
    id: "bookingSuccessBarber",
    src: null,
    swapPath: "/sale/booking-success-barber.webp",
    width: 512,
    height: 512,
    ratio: "1:1",
    labelTh: "รูปโปรไฟล์ช่างหน้าจองสำเร็จ 1:1 512×512",
    artNote: "Barber avatar on booking-success screen (demo / marketing)",
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
