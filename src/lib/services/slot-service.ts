import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { RecurringBreak } from "@/lib/data/types";
import type { Barber, BusyInterval, Slot } from "@/types/booking";

export const SHOP_TIMEZONE = "Asia/Bangkok";
export const BOOKING_WINDOW_DAYS = 7;
export const CANCEL_LEAD_MINUTES = 60;
export const LATE_GRACE_MINUTES = 10;

export function getBangkokWeekday(dateISO: string): number {
  const noon = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  return toZonedTime(noon, SHOP_TIMEZONE).getDay();
}

export function getShopHours(dateISO: string): { open: string; close: string } {
  const weekday = getBangkokWeekday(dateISO);
  const isWeekend = weekday === 0 || weekday === 6;
  return { open: isWeekend ? "10:00" : "10:30", close: "20:00" };
}

export function getBookableDates(now: Date = new Date()): string[] {
  const today = formatInTimeZone(now, SHOP_TIMEZONE, "yyyy-MM-dd");
  const dates: string[] = [];
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i += 1) {
    const day = addDays(fromZonedTime(`${today}T12:00:00`, SHOP_TIMEZONE), i);
    dates.push(formatInTimeZone(day, SHOP_TIMEZONE, "yyyy-MM-dd"));
  }
  return dates;
}

export function dayRangeUtc(dateISO: string): { from: Date; to: Date } {
  return {
    from: fromZonedTime(`${dateISO}T00:00:00`, SHOP_TIMEZONE),
    to: fromZonedTime(`${dateISO}T23:59:59.999`, SHOP_TIMEZONE),
  };
}

export function dateISOFromInstant(instant: Date): string {
  return formatInTimeZone(instant, SHOP_TIMEZONE, "yyyy-MM-dd");
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatSlotTime(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "HH:mm");
}

export function canCancelAt(startTime: string, now: Date = new Date()): boolean {
  return new Date(startTime).getTime() - now.getTime() >= CANCEL_LEAD_MINUTES * 60_000;
}

export function isLate(startTime: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(startTime).getTime() >= LATE_GRACE_MINUTES * 60_000;
}

export function recurringBreaksForDate(
  dateISO: string,
  breaks: RecurringBreak[],
): { start: Date; end: Date }[] {
  const weekday = getBangkokWeekday(dateISO);
  return breaks
    .filter((item) => item.weekday === weekday)
    .map((item) => ({
      start: fromZonedTime(`${dateISO}T${item.startTime}:00`, SHOP_TIMEZONE),
      end: fromZonedTime(`${dateISO}T${item.endTime}:00`, SHOP_TIMEZONE),
    }));
}

export function generateSlots(input: {
  dateISO: string;
  barber: Pick<Barber, "off_days" | "slot_duration_minutes">;
  busy: BusyInterval[];
  recurringBreaks?: RecurringBreak[];
  now: Date;
}): Slot[] {
  const weekday = getBangkokWeekday(input.dateISO);
  if (input.barber.off_days.includes(weekday)) {
    return [];
  }

  const { open, close } = getShopHours(input.dateISO);
  const closeAt = fromZonedTime(`${input.dateISO}T${close}:00`, SHOP_TIMEZONE);
  const duration = input.barber.slot_duration_minutes;
  const breakRanges = recurringBreaksForDate(input.dateISO, input.recurringBreaks ?? []);
  const busyRanges = [
    ...input.busy.map((item) => ({
      start: new Date(item.start_time),
      end: new Date(item.end_time),
    })),
    ...breakRanges,
  ];

  const slots: Slot[] = [];
  let start = fromZonedTime(`${input.dateISO}T${open}:00`, SHOP_TIMEZONE);

  while (true) {
    const end = addMinutes(start, duration);
    if (end > closeAt) {
      break;
    }

    const past = start.getTime() <= input.now.getTime();
    const overlap = busyRanges.some((busy) =>
      intervalsOverlap(start, end, busy.start, busy.end),
    );

    slots.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      available: !past && !overlap,
    });

    start = end;
  }

  return slots;
}
