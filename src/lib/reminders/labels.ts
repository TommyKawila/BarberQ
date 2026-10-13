import type { ReminderLeadMinutes } from "@/lib/reminders/presets";
import { REMINDER_LEAD_PRESETS_MINUTES } from "@/lib/reminders/presets";

export type ReminderLeadOption = ReminderLeadMinutes | 0;

export const REMINDER_LEAD_OPTIONS: ReminderLeadOption[] = [
  ...REMINDER_LEAD_PRESETS_MINUTES,
  0,
];

/** i18n message key suffix for a lead option */
export function reminderLeadMessageKey(
  minutes: ReminderLeadOption,
): `booking.reminderLead.${ReminderLeadOption}` {
  return `booking.reminderLead.${minutes}`;
}

export function reminderLeadAdminKey(
  minutes: ReminderLeadMinutes,
): `admin.reminderLead.${ReminderLeadMinutes}` {
  return `admin.reminderLead.${minutes}`;
}
