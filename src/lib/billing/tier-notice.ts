import {
  formatBaht,
  marketingOffer,
  resolveMarketingTierForBarberCount,
} from "@/lib/marketing/offer";
import type { Shop } from "@/types/booking";
import {
  type BarberTierId,
  tierRangeLabelTh,
} from "@/lib/billing/barber-tier";

/** First trial day when the in-app billing notice may appear (1 = created day). */
export const TIER_NOTICE_FROM_TRIAL_DAY = 25;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar trial day number (day 1 = created day). */
export function shopTrialDayNumber(
  shop: Pick<Shop, "created_at">,
  now: Date = new Date(),
): number {
  const created = Date.parse(shop.created_at);
  if (!Number.isFinite(created)) return 1;
  const elapsed = Math.max(0, now.getTime() - created);
  return Math.floor(elapsed / MS_PER_DAY) + 1;
}

/**
 * Persistent admin notice from trial day 25 onward.
 * Content always reflects current bookable count (updates when seats cross tiers).
 */
export function shouldShowTierBillingNotice(
  shop: Pick<Shop, "created_at">,
  now: Date = new Date(),
): boolean {
  return shopTrialDayNumber(shop, now) >= TIER_NOTICE_FROM_TRIAL_DAY;
}

/** Recommended pack for a bookable-seat count (owner free unless bookable). */
export function recommendedTierForBookableCount(
  bookableCount: number,
): BarberTierId {
  const resolved = resolveMarketingTierForBarberCount(
    Math.max(1, bookableCount),
  );
  if (resolved === "contact" || resolved == null) return "contact";
  return resolved.id as BarberTierId;
}

export interface TierBillingNoticeCopy {
  bookableCount: number;
  recommendedTier: BarberTierId;
  rangeLabel: string;
  priceLabel: string | null;
  /** Full Thai body for the banner. */
  message: string;
}

export function buildTierBillingNoticeCopy(
  bookableCount: number,
): TierBillingNoticeCopy {
  const recommendedTier = recommendedTierForBookableCount(bookableCount);
  const rangeLabel = tierRangeLabelTh(recommendedTier);
  const tierRow = marketingOffer.tiers.find((t) => t.id === recommendedTier);
  const priceLabel = tierRow ? formatBaht(tierRow.monthlyPriceThb) : null;

  let message: string;
  if (recommendedTier === "contact" || !priceLabel) {
    message = `ร้านคุณมีช่างรับคิว ${bookableCount} คน แพ็กที่เหมาะคือ ${rangeLabel} — มีคำถามทักเราได้ ไม่มีการตัดบัตรอัตโนมัติ ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด`;
  } else {
    message = `ร้านคุณมีช่างรับคิว ${bookableCount} คน แพ็กที่เหมาะคือ ${rangeLabel} ${priceLabel}/เดือน ไม่มีการตัดบัตรอัตโนมัติ ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด`;
  }

  return {
    bookableCount,
    recommendedTier,
    rangeLabel,
    priceLabel,
    message,
  };
}
