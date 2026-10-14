import { reminderDueAt } from "@/lib/reminders/presets";
import type { ReminderLeadOption } from "@/lib/reminders/labels";

/** Customer-facing chips (no 2h) — LIFF-safe; avoid native <select>. */
export const CUSTOMER_REMINDER_CHIP_OPTIONS: readonly ReminderLeadOption[] = [
  1440, 180, 60, 30, 0,
];

export function isCustomerReminderLeadFuture(
  leadMinutes: ReminderLeadOption,
  startTime: Date,
  now: Date = new Date(),
): boolean {
  if (leadMinutes <= 0) return true;
  return reminderDueAt(startTime, leadMinutes).getTime() > now.getTime();
}

/**
 * Pick the chip to pre-select from shop default.
 * If shop default isn't a chip (e.g. 120) or is already past, fall back to the
 * nearest still-future chip (longest lead first among remaining).
 */
export function defaultCustomerReminderChip(
  shopDefaultMinutes: number,
  startTime: Date,
  now: Date = new Date(),
): ReminderLeadOption {
  const chips = CUSTOMER_REMINDER_CHIP_OPTIONS.filter((m) => m > 0);
  if (
    (CUSTOMER_REMINDER_CHIP_OPTIONS as readonly number[]).includes(shopDefaultMinutes) &&
    isCustomerReminderLeadFuture(shopDefaultMinutes as ReminderLeadOption, startTime, now)
  ) {
    return shopDefaultMinutes as ReminderLeadOption;
  }

  const future = chips
    .filter((m) => isCustomerReminderLeadFuture(m, startTime, now))
    .sort((a, b) => b - a);

  if (shopDefaultMinutes > 0) {
    const shorterOrEqual = future.filter((m) => m <= shopDefaultMinutes);
    if (shorterOrEqual.length > 0) return shorterOrEqual[0];
  }
  if (future.length > 0) return future[0];
  return 0;
}
