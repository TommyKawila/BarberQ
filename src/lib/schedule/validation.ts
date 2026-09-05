import type { RecurringBreak } from "@/lib/data/types";

export const ALLOWED_SLOT_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export const MAX_BREAKS_PER_DAY = 3;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidWeekday(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function normalizeOffDays(days: number[]): number[] {
  return [...new Set(days.filter(isValidWeekday))].sort((a, b) => a - b);
}

export function validateOffDays(days: number[]): string | null {
  const normalized = normalizeOffDays(days);
  if (normalized.length >= 7) {
    return "At least one working day is required";
  }
  return null;
}

export function validateSlotDuration(minutes: number): string | null {
  if (!ALLOWED_SLOT_DURATIONS.includes(minutes as (typeof ALLOWED_SLOT_DURATIONS)[number])) {
    return "Invalid slot duration";
  }
  return null;
}

export function parseTimeHHmm(value: string): string | null {
  const trimmed = value.trim();
  if (!TIME_RE.test(trimmed)) return null;
  return trimmed;
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function validateRecurringBreakInput(input: {
  weekday: number;
  startTime: string;
  endTime: string;
}): string | null {
  if (!isValidWeekday(input.weekday)) return "Invalid weekday";
  const startTime = parseTimeHHmm(input.startTime);
  const endTime = parseTimeHHmm(input.endTime);
  if (!startTime || !endTime) return "Invalid time format";
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return "End time must be after start time";
  }
  return null;
}

export function countBreaksForWeekday(breaks: RecurringBreak[], weekday: number): number {
  return breaks.filter((item) => item.weekday === weekday).length;
}
