/** Lead-time presets (minutes before start). Null / 0 = no reminder. */
export const REMINDER_LEAD_PRESETS_MINUTES = [1440, 180, 120, 60, 30] as const;

export type ReminderLeadMinutes = (typeof REMINDER_LEAD_PRESETS_MINUTES)[number];

export const DEFAULT_SHOP_REMINDER_LEAD_MINUTES: ReminderLeadMinutes = 120;

export function isReminderLeadPreset(value: unknown): value is ReminderLeadMinutes {
  return (
    typeof value === "number" &&
    (REMINDER_LEAD_PRESETS_MINUTES as readonly number[]).includes(value)
  );
}

export function reminderDueAt(
  startTime: Date,
  leadMinutes: number,
): Date {
  return new Date(startTime.getTime() - leadMinutes * 60_000);
}
