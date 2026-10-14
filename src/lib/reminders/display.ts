import type { ReminderLeadMinutes } from "@/lib/reminders/presets";
import { isReminderLeadPreset } from "@/lib/reminders/presets";

/** Short Thai/EN-ready label key for a stored lead, or null when none. */
export function reminderLeadFromAppointment(
  leadMinutes: number | null | undefined,
): ReminderLeadMinutes | null {
  if (leadMinutes == null || leadMinutes <= 0) return null;
  return isReminderLeadPreset(leadMinutes) ? leadMinutes : null;
}

export function reminderDisplayMessageKey(
  leadMinutes: number | null | undefined,
): `booking.reminderLead.${ReminderLeadMinutes}` | null {
  const lead = reminderLeadFromAppointment(leadMinutes);
  if (lead == null) return null;
  return `booking.reminderLead.${lead}`;
}
