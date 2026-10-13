/** Single source of truth for public marketing pricing & trial facts. */
export const marketingOffer = {
  trialDays: 30,
  lineFreePushQuota: 300,
  tiers: [
    { id: "tier1", minBarbers: 1, maxBarbers: 5, monthlyPriceThb: 599 },
    { id: "tier2", minBarbers: 6, maxBarbers: 10, monthlyPriceThb: 999 },
  ],
  /** Shops with this many barbers or more use contact CTA. */
  contactFromBarbers: 11,
} as const;

export type MarketingTier = (typeof marketingOffer.tiers)[number];

export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

export function tierBarberRangeLabel(
  tier: MarketingTier,
  locale: "th" | "en",
): string {
  if (locale === "th") {
    return `${tier.minBarbers}–${tier.maxBarbers} ช่าง`;
  }
  return `${tier.minBarbers}–${tier.maxBarbers} barbers`;
}

export function tierPricePerMonthLabel(
  tier: MarketingTier,
  locale: "th" | "en",
): string {
  const price = formatBaht(tier.monthlyPriceThb);
  return locale === "th" ? `${price} / เดือน` : `${price} / month`;
}

/**
 * Resolve which marketing tier a shop seat count maps to.
 * Returns null when the shop should use the contact CTA.
 */
export function resolveMarketingTierForBarberCount(
  barberCount: number,
): MarketingTier | "contact" | null {
  if (!Number.isFinite(barberCount) || barberCount < 1) return null;
  if (barberCount >= marketingOffer.contactFromBarbers) return "contact";
  for (const tier of marketingOffer.tiers) {
    if (barberCount >= tier.minBarbers && barberCount <= tier.maxBarbers) {
      return tier;
    }
  }
  return null;
}

/** Fill `{days}` / `{quota}` / `{price}` placeholders from marketingOffer. */
export function fillOfferCopy(template: string): string {
  const starter = formatBaht(marketingOffer.tiers[0].monthlyPriceThb);
  return template
    .replaceAll("{days}", String(marketingOffer.trialDays))
    .replaceAll("{quota}", String(marketingOffer.lineFreePushQuota))
    .replaceAll("{price}", starter);
}
