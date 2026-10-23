import { marketingOffer } from "@/lib/marketing/offer";
import type { Shop } from "@/types/booking";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Trial ends at created_at + trialDays (default 30). */
export function shopTrialEndsAt(
  shop: Pick<Shop, "created_at">,
): Date {
  const created = Date.parse(shop.created_at);
  if (!Number.isFinite(created)) return new Date(NaN);
  return new Date(created + marketingOffer.trialDays * MS_PER_DAY);
}

/**
 * Next payment due:
 * - During / until trial: trial end
 * - After paid months: subscribed_until (paid-through)
 * - Past trial unpaid: trial end (overdue)
 */
export function shopBillingDueAt(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): Date {
  const trialEnd = shopTrialEndsAt(shop);
  const paidUntil = shop.subscribed_until
    ? new Date(shop.subscribed_until)
    : null;

  if (paidUntil && Number.isFinite(paidUntil.getTime()) && paidUntil > trialEnd) {
    return paidUntil;
  }
  if (paidUntil && Number.isFinite(paidUntil.getTime()) && paidUntil.getTime() > now.getTime()) {
    return paidUntil;
  }
  return trialEnd;
}

export function isBillingOverdue(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): boolean {
  return shopBillingDueAt(shop, now).getTime() < now.getTime();
}

/**
 * Extend paid-through (shops.subscribed_until) by 1 calendar month
 * from max(now, current subscribed_until, trial end).
 */
export function nextSubscribedUntilAfterPayment(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): Date {
  const trialEnd = shopTrialEndsAt(shop);
  const current = shop.subscribed_until
    ? new Date(shop.subscribed_until)
    : null;
  const baseMs = Math.max(
    now.getTime(),
    trialEnd.getTime(),
    current && Number.isFinite(current.getTime()) ? current.getTime() : 0,
  );
  const base = new Date(baseMs);
  const next = new Date(base);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}
