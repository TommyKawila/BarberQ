import { formatBaht, marketingOffer } from "@/lib/marketing/offer";
import type { Barber, Shop } from "@/types/booking";

/** Seat tiers stored on shops.barber_tier (matches marketingOffer.tiers + contact). */
export const BARBER_TIERS = ["tier1", "tier2", "tier3", "contact"] as const;
export type BarberTierId = (typeof BARBER_TIERS)[number];

/** Counts that cross into the next paid tier (soft prompt thresholds). */
export const OVER_TIER_THRESHOLDS = [3, 6, 11] as const;

export function isBarberTierId(value: unknown): value is BarberTierId {
  return (
    typeof value === "string" &&
    (BARBER_TIERS as readonly string[]).includes(value)
  );
}

export function normalizeBarberTier(
  value: string | null | undefined,
): BarberTierId {
  return isBarberTierId(value) ? value : "tier1";
}

/** Max bookable seats included in the tier; null = contact / negotiated. */
export function tierMaxBookable(tier: BarberTierId): number | null {
  if (tier === "tier1") return 2;
  if (tier === "tier2") return 5;
  if (tier === "tier3") return 10;
  return null;
}

export function tierMonthlyPriceThb(tier: BarberTierId): number | null {
  const row = marketingOffer.tiers.find((t) => t.id === tier);
  return row?.monthlyPriceThb ?? null;
}

export function tierRangeLabelTh(tier: BarberTierId): string {
  if (tier === "tier1") return "1–2 ช่าง";
  if (tier === "tier2") return "3–5 ช่าง";
  if (tier === "tier3") return "6–10 ช่าง";
  return "เกิน 10 ช่าง";
}

/**
 * A seat counts toward the soft quota when the barber is active and bookable.
 * Owner with is_bookable=false does not count (free owner/manager seat).
 */
export function countsTowardBarberQuota(barber: {
  is_active?: boolean;
  is_bookable?: boolean;
}): boolean {
  if (barber.is_active === false) return false;
  return barber.is_bookable !== false;
}

export function countBookableBarberSeats(
  barbers: readonly { is_active?: boolean; is_bookable?: boolean }[],
): number {
  return barbers.filter(countsTowardBarberQuota).length;
}

export function isOverTier(
  bookableCount: number,
  tier: BarberTierId,
): boolean {
  const max = tierMaxBookable(tier);
  if (max == null) return false;
  return bookableCount > max;
}

/** Soft prompt when crossing 3 / 6 / 11 bookable seats (never blocks). */
export function crossedOverTierThreshold(
  previousCount: number,
  nextCount: number,
): boolean {
  return OVER_TIER_THRESHOLDS.some(
    (n) => previousCount < n && nextCount >= n,
  );
}

/** First 30 days after shop.created_at — no over-tier modal. */
export function isShopInTrialPeriod(
  shop: Pick<Shop, "created_at">,
  now: Date = new Date(),
): boolean {
  const created = Date.parse(shop.created_at);
  if (!Number.isFinite(created)) return false;
  const ms = marketingOffer.trialDays * 24 * 60 * 60 * 1000;
  return now.getTime() - created < ms;
}

export type OverTierPromptKind = "tier2" | "tier3" | "contact";

export function overTierPromptKindForCount(
  bookableCount: number,
): OverTierPromptKind | null {
  if (bookableCount >= 11) return "contact";
  if (bookableCount >= 6) return "tier3";
  if (bookableCount >= 3) return "tier2";
  return null;
}

export interface OverTierPromptCopy {
  kind: OverTierPromptKind;
  title: string;
  /** Joined paragraphs (tests / legacy). Prefer bodyParagraphs for UI. */
  body: string;
  bodyParagraphs: string[];
  signature: string | null;
  footnote: string;
  primaryCta: string;
  secondaryCta: string;
  /** Link to admin billing (PromptPay QR). */
  billingCta: string;
  nextTierPriceLabel: string | null;
}

function buildPrompt(parts: {
  kind: OverTierPromptKind;
  title: string;
  paragraphs: string[];
  signature: string | null;
  footnote: string;
  primaryCta: string;
  secondaryCta: string;
  billingCta: string;
  nextTierPriceLabel: string | null;
}): OverTierPromptCopy {
  return {
    kind: parts.kind,
    title: parts.title,
    body: parts.paragraphs.join(" "),
    bodyParagraphs: parts.paragraphs,
    signature: parts.signature,
    footnote: parts.footnote,
    primaryCta: parts.primaryCta,
    secondaryCta: parts.secondaryCta,
    billingCta: parts.billingCta,
    nextTierPriceLabel: parts.nextTierPriceLabel,
  };
}

/** Thai in-app copy (Tommy-approved). Price starts next billing cycle — no grace/countdown. */
export function buildOverTierPromptCopy(
  bookableCount: number,
  locale: "th" | "en" = "th",
): OverTierPromptCopy | null {
  const kind = overTierPromptKindForCount(bookableCount);
  if (!kind) return null;

  const billingCtaEn = "Pay via PromptPay QR";
  const billingCtaTh = "ไปหน้าชำระเงิน PromptPay";

  if (locale === "en") {
    if (kind === "tier2") {
      return buildPrompt({
        kind,
        title: `Your shop now has ${bookableCount} bookable barbers 🎉`,
        paragraphs: [
          "You can keep adding — everything still works. Customers can book the new barber right away, and they get their own queue alerts.",
          `The 3–5 barber plan is ${formatBaht(599)}/month with the same features. There is no automatic charge — pay via PromptPay QR on the billing page by the due date.`,
        ],
        signature: null,
        footnote:
          'The owner account is free and does not count as a barber unless "Accept bookings too" is on.',
        primaryCta: "Keep adding",
        secondaryCta: "Questions? Message us",
        billingCta: billingCtaEn,
        nextTierPriceLabel: formatBaht(599),
      });
    }
    if (kind === "tier3") {
      return buildPrompt({
        kind,
        title: `Your shop now has ${bookableCount} bookable barbers 🎉`,
        paragraphs: [
          "You can keep adding — everything still works. Customers can book the new barber right away, and they get their own queue alerts.",
          `The 6–10 barber plan is ${formatBaht(999)}/month with the same features. There is no automatic charge — pay via PromptPay QR on the billing page by the due date.`,
        ],
        signature: null,
        footnote:
          'The owner account is free and does not count as a barber unless "Accept bookings too" is on.',
        primaryCta: "Keep adding",
        secondaryCta: "Questions? Message us",
        billingCta: billingCtaEn,
        nextTierPriceLabel: formatBaht(999),
      });
    }
    return buildPrompt({
      kind,
      title: `Your shop now has ${bookableCount} bookable barbers 🎉`,
      paragraphs: [
        "You can keep adding — everything still works. For more than 10 barbers, message us if you have pricing questions. There is no automatic charge — pay via PromptPay QR on the billing page by the due date.",
      ],
      signature: null,
      footnote:
        'The owner account is free and does not count as a barber unless "Accept bookings too" is on.',
      primaryCta: "Keep adding",
      secondaryCta: "Questions? Message us",
      billingCta: billingCtaEn,
      nextTierPriceLabel: null,
    });
  }

  const p1 =
    "เพิ่มต่อได้เลยครับ ทุกอย่างใช้ได้ตามปกติ ลูกค้าเลือกช่างคนใหม่ได้ทันที และช่างจะได้แจ้งเตือนคิวของตัวเอง";

  if (kind === "tier2") {
    return buildPrompt({
      kind,
      title: `ร้านมีช่าง ${bookableCount} คนแล้ว 🎉`,
      paragraphs: [
        p1,
        `ร้าน 3–5 ช่างอยู่แพ็ก ${formatBaht(599)}/เดือน ฟีเจอร์เหมือนเดิมทุกอย่าง ไม่มีการตัดบัตรอัตโนมัติ — ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด`,
      ],
      signature: null,
      footnote: 'เจ้าของร้านไม่นับเป็นช่าง ยกเว้นเปิด "รับคิวด้วย"',
      primaryCta: "เพิ่มช่างต่อ",
      secondaryCta: "มีคำถาม? ทักเรา",
      billingCta: billingCtaTh,
      nextTierPriceLabel: formatBaht(599),
    });
  }
  if (kind === "tier3") {
    return buildPrompt({
      kind,
      title: `ร้านมีช่าง ${bookableCount} คนแล้ว 🎉`,
      paragraphs: [
        p1,
        `ร้าน 6–10 ช่างอยู่แพ็ก ${formatBaht(999)}/เดือน ฟีเจอร์เหมือนเดิมทุกอย่าง ไม่มีการตัดบัตรอัตโนมัติ — ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด`,
      ],
      signature: null,
      footnote: 'เจ้าของร้านไม่นับเป็นช่าง ยกเว้นเปิด "รับคิวด้วย"',
      primaryCta: "เพิ่มช่างต่อ",
      secondaryCta: "มีคำถาม? ทักเรา",
      billingCta: billingCtaTh,
      nextTierPriceLabel: formatBaht(999),
    });
  }
  return buildPrompt({
    kind,
    title: `ร้านมีช่าง ${bookableCount} คนแล้ว 🎉`,
    paragraphs: [
      "เพิ่มต่อได้เลยครับ ทุกอย่างใช้ได้ตามปกติ เกิน 10 ช่างมีคำถามทักเราได้ ไม่มีการตัดบัตรอัตโนมัติ — ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด",
    ],
    signature: null,
    footnote: 'เจ้าของร้านไม่นับเป็นช่าง ยกเว้นเปิด "รับคิวด้วย"',
    primaryCta: "เพิ่มช่างต่อ",
    secondaryCta: "มีคำถาม? ทักเรา",
    billingCta: billingCtaTh,
    nextTierPriceLabel: null,
  });
}

export function evaluateOverTierAfterSeatChange(input: {
  shop: Pick<Shop, "created_at" | "barber_tier">;
  barbersBefore: readonly Barber[];
  /** Seat count after the change (create / reactivate / turn bookable on). */
  bookableCountAfter: number;
  now?: Date;
}): {
  showPrompt: boolean;
  bookableCount: number;
  prompt: OverTierPromptCopy | null;
} {
  const before = countBookableBarberSeats(input.barbersBefore);
  const after = input.bookableCountAfter;
  const inTrial = isShopInTrialPeriod(input.shop, input.now);
  const crossed = crossedOverTierThreshold(before, after);
  const showPrompt = !inTrial && crossed;
  return {
    showPrompt,
    bookableCount: after,
    prompt: showPrompt ? buildOverTierPromptCopy(after) : null,
  };
}
