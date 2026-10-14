/**
 * Real-people photo slots for the sale page.
 * Swap in WebP/AVIF under `public/marketing/photos/` then set `src`.
 * Until then, UI renders a clearly labeled placeholder (no stock/AI faces).
 *
 * Needed assets (see PR description):
 * 1. hero-hand-phone.webp — hand holding phone in a real shop (LINE chat on screen)
 * 2. barber-queue-board.webp — real pilot-shop barber looking at the queue board
 * 3. founder-tommy.webp — Tommy (founder), looking at camera
 */
export type MarketingPhotoSlotId = "heroHandPhone" | "barberQueueBoard" | "founderTommy";

export type MarketingPhotoSlot = {
  id: MarketingPhotoSlotId;
  /** Public URL once the real photo is ready; null = show placeholder. */
  src: string | null;
  /** Target path under /public for the swap. */
  swapPath: string;
  width: number;
  height: number;
  /** Short machine label baked into the placeholder UI. */
  label: string;
};

export const marketingPhotoSlots: Record<MarketingPhotoSlotId, MarketingPhotoSlot> = {
  heroHandPhone: {
    id: "heroHandPhone",
    src: null,
    swapPath: "/marketing/photos/hero-hand-phone.webp",
    width: 1122,
    height: 1402,
    label: "PHOTO SLOT · hero hand + phone",
  },
  barberQueueBoard: {
    id: "barberQueueBoard",
    src: null,
    swapPath: "/marketing/photos/barber-queue-board.webp",
    width: 960,
    height: 1200,
    label: "PHOTO SLOT · barber + queue board",
  },
  founderTommy: {
    id: "founderTommy",
    src: null,
    swapPath: "/marketing/photos/founder-tommy.webp",
    width: 640,
    height: 640,
    label: "PHOTO SLOT · founder Tommy",
  },
} as const;
