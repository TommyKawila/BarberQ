import {
  type BarberTierId,
  tierMonthlyPriceThb,
  tierRangeLabelTh,
} from "@/lib/billing/barber-tier";
import { recommendedTierForBookableCount } from "@/lib/billing/tier-notice";
import { formatBaht } from "@/lib/marketing/offer";

export const BILLING_PERIODS = ["monthly", "yearly"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/** Annual = monthly × 12 × 0.8 (20% off), rounded to whole baht. */
export const YEARLY_DISCOUNT_RATE = 0.2;

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return (
    typeof value === "string" &&
    (BILLING_PERIODS as readonly string[]).includes(value)
  );
}

export function normalizeBillingPeriod(value: unknown): BillingPeriod {
  return isBillingPeriod(value) ? value : "monthly";
}

export function monthsForBillingPeriod(period: BillingPeriod): number {
  return period === "yearly" ? 12 : 1;
}

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

export function yearlyAmountFromMonthly(monthlyThb: number): number {
  return Math.round(monthlyThb * 12 * (1 - YEARLY_DISCOUNT_RATE));
}

export function resolveBillingAmountForPeriod(
  bookableCount: number,
  period: BillingPeriod = "monthly",
): {
  billingTier: BarberTierId;
  rangeLabel: string;
  period: BillingPeriod;
  amountThb: number | null;
  priceLabel: string | null;
  monthlyAmountThb: number | null;
  monthlyPriceLabel: string | null;
  yearlyAmountThb: number | null;
  yearlyPriceLabel: string | null;
  yearlySavingsThb: number | null;
  yearlySavingsLabel: string | null;
} {
  const base = resolveBillingAmountForBookableCount(bookableCount);
  const monthlyAmountThb = base.amountThb;
  const yearlyAmountThb =
    monthlyAmountThb != null ? yearlyAmountFromMonthly(monthlyAmountThb) : null;
  const fullYear =
    monthlyAmountThb != null ? monthlyAmountThb * 12 : null;
  const yearlySavingsThb =
    fullYear != null && yearlyAmountThb != null
      ? fullYear - yearlyAmountThb
      : null;

  const amountThb =
    period === "yearly" ? yearlyAmountThb : monthlyAmountThb;

  return {
    billingTier: base.billingTier,
    rangeLabel: base.rangeLabel,
    period,
    amountThb,
    priceLabel: amountThb != null ? formatBaht(amountThb) : null,
    monthlyAmountThb,
    monthlyPriceLabel:
      monthlyAmountThb != null ? formatBaht(monthlyAmountThb) : null,
    yearlyAmountThb,
    yearlyPriceLabel:
      yearlyAmountThb != null ? formatBaht(yearlyAmountThb) : null,
    yearlySavingsThb,
    yearlySavingsLabel:
      yearlySavingsThb != null ? formatBaht(yearlySavingsThb) : null,
  };
}
