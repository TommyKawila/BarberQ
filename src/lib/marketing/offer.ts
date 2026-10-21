/** Single source of truth for public marketing pricing & trial facts. */
export const marketingOffer = {
  trialDays: 30,
  lineFreePushQuota: 300,
  tiers: [
    { id: "tier1", minBarbers: 1, maxBarbers: 2, monthlyPriceThb: 399 },
    { id: "tier2", minBarbers: 3, maxBarbers: 5, monthlyPriceThb: 599 },
    { id: "tier3", minBarbers: 6, maxBarbers: 10, monthlyPriceThb: 999 },
  ],
  /** Shops with this many barbers or more use contact CTA. */
  contactFromBarbers: 11,
} as const;

/**
 * Public claim gates for the sale page (kept so claims can be flipped off).
 * Default ON per owner request — page presents full reminder leads + self-reschedule.
 * - reminderShortLeads: 1d / 3h / 1h / 30m options
 * - customerSelfReschedule: customer can reschedule once per booking
 */
export const marketingClaims = {
  reminderShortLeads: true,
  customerSelfReschedule: true,
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

/** Daily framing for starter tier (399/30 ≈ ฿13). */
export function tierPerDayHint(tier: MarketingTier, locale: "th" | "en"): string | null {
  if (tier.id !== "tier1") return null;
  return locale === "th" ? "ตกวันละประมาณ 13 บาท" : "About ฿13/day";
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

/**
 * Fill offer placeholders from marketingOffer:
 * `{days}` `{quota}` `{price}`=399
 * `{price2}`/`{priceMid}`=599 `{price3}`/`{priceLarge}`=999
 */
export function fillOfferCopy(template: string): string {
  const [t1, t2, t3] = marketingOffer.tiers;
  const p1 = formatBaht(t1.monthlyPriceThb);
  const p2 = formatBaht(t2.monthlyPriceThb);
  const p3 = formatBaht(t3.monthlyPriceThb);
  return template
    .replaceAll("{days}", String(marketingOffer.trialDays))
    .replaceAll("{quota}", String(marketingOffer.lineFreePushQuota))
    .replaceAll("{price}", p1)
    .replaceAll("{price2}", p2)
    .replaceAll("{price3}", p3)
    .replaceAll("{priceMid}", p2)
    .replaceAll("{priceLarge}", p3);
}
