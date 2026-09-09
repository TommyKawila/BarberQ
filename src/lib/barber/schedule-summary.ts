import type { MessageKey } from "@/lib/i18n/dictionary";

const WEEKDAY_KEYS: MessageKey[] = [
  "common.sunday",
  "common.monday",
  "common.tuesday",
  "common.wednesday",
  "common.thursday",
  "common.friday",
  "common.saturday",
];

export function formatOffDaysSummary(
  offDays: number[],
  t: (key: MessageKey) => string,
): string {
  if (offDays.length === 0) return "—";
  return offDays
    .sort((a, b) => a - b)
    .map((d) => t(WEEKDAY_KEYS[d] ?? "common.monday"))
    .join(", ");
}

export function formatBreaksSummary(
  breaks: { weekday: number; startTime: string; endTime: string }[],
  t: (key: MessageKey) => string,
): string {
  if (breaks.length === 0) return "—";
  return breaks
    .map((b) => `${t(WEEKDAY_KEYS[b.weekday] ?? "common.monday")} ${b.startTime}–${b.endTime}`)
    .join(", ");
}
