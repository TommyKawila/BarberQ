import { marketingOffer } from "@/lib/marketing/offer";
import type { Shop } from "@/types/booking";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days after due before new customer online bookings are blocked. */
export const BILLING_GRACE_DAYS = 7;

/** LINE reminder kinds relative to the billing due date. */
export const BILLING_REMINDER_KINDS = ["day25", "due", "overdue3"] as const;
export type BillingReminderKind = (typeof BILLING_REMINDER_KINDS)[number];

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

/** UTC calendar date YYYY-MM-DD for idempotent reminder cycle keys. */
export function billingDueDateKey(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): string {
  return shopBillingDueAt(shop, now).toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Whole UTC calendar days from due date to `now`
 * (negative = before due, 0 = due day, positive = past due).
 */
export function billingDaysFromDue(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): number {
  const due = shopBillingDueAt(shop, now);
  if (!Number.isFinite(due.getTime())) return Number.NaN;
  return Math.round((startOfUtcDay(now) - startOfUtcDay(due)) / MS_PER_DAY);
}

/**
 * Reminder schedule (Tommy-approved):
 * - day25 → 5 days before due (day 25 of a 30-day cycle)
 * - due → due day
 * - overdue3 → 3 days after due
 */
export function resolveBillingReminderKind(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): BillingReminderKind | null {
  const days = billingDaysFromDue(shop, now);
  if (!Number.isFinite(days)) return null;
  if (days === -5) return "day25";
  if (days === 0) return "due";
  if (days === 3) return "overdue3";
  return null;
}

export function shopBillingGraceEndsAt(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): Date {
  const due = shopBillingDueAt(shop, now);
  return new Date(due.getTime() + BILLING_GRACE_DAYS * MS_PER_DAY);
}

/** True once grace has expired — block NEW customer online bookings only. */
export function isPastBillingGrace(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): boolean {
  const graceEnd = shopBillingGraceEndsAt(shop, now);
  if (!Number.isFinite(graceEnd.getTime())) return false;
  return now.getTime() > graceEnd.getTime();
}

/**
 * Days remaining in the post-due grace window (ceil).
 * 0 when not overdue or grace already ended.
 */
export function graceDaysRemaining(
  shop: Pick<Shop, "created_at" | "subscribed_until">,
  now: Date = new Date(),
): number {
  if (!isBillingOverdue(shop, now)) return 0;
  const graceEnd = shopBillingGraceEndsAt(shop, now);
  const msLeft = graceEnd.getTime() - now.getTime();
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / MS_PER_DAY);
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
