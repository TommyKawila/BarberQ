import {
  REMINDER_LEAD_PRESETS_MINUTES,
  reminderDueAt,
  type ReminderLeadMinutes,
} from "@/lib/reminders/presets";

/**
 * Resolve the lead time to schedule.
 * If the chosen lead's due time is already past, fall back to the next shorter
 * preset that is still in the future. If none, return null (no reminder).
 */
export function resolveReminderLeadMinutes(
  preferredMinutes: number | null | undefined,
  startTime: Date,
  now: Date = new Date(),
): ReminderLeadMinutes | null {
  if (preferredMinutes == null || preferredMinutes <= 0) return null;

  const isStillFuture = (lead: number) =>
    reminderDueAt(startTime, lead).getTime() > now.getTime();

  if (isStillFuture(preferredMinutes)) {
    return preferredMinutes as ReminderLeadMinutes;
  }

  const fallbacks = REMINDER_LEAD_PRESETS_MINUTES
    .filter((m) => m < preferredMinutes)
    .slice()
    .sort((a, b) => b - a);

  for (const lead of fallbacks) {
    if (isStillFuture(lead)) return lead;
  }
  return null;
}

export function computeReminderSchedule(
  preferredMinutes: number | null | undefined,
  startTime: Date,
  now: Date = new Date(),
): { leadMinutes: ReminderLeadMinutes; dueAt: Date } | null {
  const lead = resolveReminderLeadMinutes(preferredMinutes, startTime, now);
  if (lead == null) return null;
  return { leadMinutes: lead, dueAt: reminderDueAt(startTime, lead) };
}
