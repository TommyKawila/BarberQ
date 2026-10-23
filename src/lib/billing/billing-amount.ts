import {
  type BarberTierId,
  tierMonthlyPriceThb,
  tierRangeLabelTh,
} from "@/lib/billing/barber-tier";
import { recommendedTierForBookableCount } from "@/lib/billing/tier-notice";
import { formatBaht } from "@/lib/marketing/offer";

/**
 * Single source of truth for what the shop owes this cycle.
 * Always derived from current bookable seat count (same as day-25 notice) —
 * never stale shops.barber_tier.
 */
export function resolveBillingAmountForBookableCount(bookableCount: number): {
  billingTier: BarberTierId;
  rangeLabel: string;
  amountThb: number | null;
  priceLabel: string | null;
} {
  const billingTier = recommendedTierForBookableCount(bookableCount);
  const amountThb = tierMonthlyPriceThb(billingTier);
  return {
    billingTier,
    rangeLabel: tierRangeLabelTh(billingTier),
    amountThb,
    priceLabel: amountThb != null ? formatBaht(amountThb) : null,
  };
}
