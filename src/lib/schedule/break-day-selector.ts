import type { MessageKey } from "@/lib/i18n/dictionary";
import { validateRecurringBreakInput } from "@/lib/schedule/validation";

export const BREAK_WEEKDAYS_MON_FIRST: {
  value: number;
  shortKey: MessageKey;
  fullKey: MessageKey;
}[] = [
  { value: 1, shortKey: "common.monShort", fullKey: "common.monday" },
  { value: 2, shortKey: "common.tueShort", fullKey: "common.tuesday" },
  { value: 3, shortKey: "common.wedShort", fullKey: "common.wednesday" },
  { value: 4, shortKey: "common.thuShort", fullKey: "common.thursday" },
  { value: 5, shortKey: "common.friShort", fullKey: "common.friday" },
  { value: 6, shortKey: "common.satShort", fullKey: "common.saturday" },
  { value: 0, shortKey: "common.sunShort", fullKey: "common.sunday" },
];

export type BreakFormValidationError = "selectDayRequired" | "invalidTime";

export function validateBreakFormInput(input: {
  weekday: number | null;
  startTime: string;
  endTime: string;
}): BreakFormValidationError | null {
  if (input.weekday === null) return "selectDayRequired";
  const err = validateRecurringBreakInput({
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
  });
  if (err) return "invalidTime";
  return null;
}

export function buildCreateBreakBody(input: {
  weekday: number;
  startTime: string;
  endTime: string;
}) {
  return {
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
  };
}
