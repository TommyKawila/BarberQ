import { addDays, addMinutes, differenceInMinutes, endOfMonth, parseISO, startOfMonth } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { StaffAuth } from "@/lib/admin-auth";
import { isOccupyingStatus } from "@/lib/appointment-status";
import { getStore } from "@/lib/data";
import { listBarbers } from "@/lib/services/booking-service";
import {
  dayRangeUtc,
  getBangkokWeekday,
  getShopHours,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { Appointment, Barber, TimeBlock } from "@/types/booking";

export type StatsRange = "day" | "week" | "month";

export interface StatsTotals {
  uniqueCustomers: number;
  booked: number;
  cancelled: number;
  completed: number;
  noShow: number;
  walkIns: number;
  newCustomers: number;
  utilizationPct: number;
}

export interface StatsHourRow {
  hour: number;
  booked: number;
  walkIn: number;
  free: number;
}

export interface StatsBarberRow {
  barberId: string;
  name: string;
  booked: number;
  completed: number;
  cancelled: number;
  minutes: number;
}

export interface StatsTrendRow {
  dateISO: string;
  booked: number;
  completed: number;
  cancelled: number;
}

export interface StatsBlockRow {
  barberId: string;
  barberName: string;
  start: string;
  end: string;
  reason: string;
}

export interface StatsReport {
  range: { from: string; to: string; label: string; kind: StatsRange };
  totals: StatsTotals;
  byHour: StatsHourRow[];
  byBarber: StatsBarberRow[];
  trend: StatsTrendRow[];
  blocks: StatsBlockRow[];
}

function parseDateISO(dateISO: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new Error("INVALID_DATE");
  }
}

function datesInRange(fromISO: string, toISO: string): string[] {
  const dates: string[] = [];
  let cursor = fromISO;
  while (cursor <= toISO) {
    dates.push(cursor);
    const next = addDays(fromZonedTime(`${cursor}T12:00:00`, SHOP_TIMEZONE), 1);
    cursor = formatInTimeZone(next, SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  return dates;
}

function weekBounds(dateISO: string): { from: string; to: string } {
  const weekday = getBangkokWeekday(dateISO);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE), mondayOffset);
  const sunday = addDays(monday, 6);
  return {
    from: formatInTimeZone(monday, SHOP_TIMEZONE, "yyyy-MM-dd"),
    to: formatInTimeZone(sunday, SHOP_TIMEZONE, "yyyy-MM-dd"),
  };
}

function monthBounds(dateISO: string): { from: string; to: string } {
  const anchor = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return {
    from: formatInTimeZone(start, SHOP_TIMEZONE, "yyyy-MM-dd"),
    to: formatInTimeZone(end, SHOP_TIMEZONE, "yyyy-MM-dd"),
  };
}

function resolveRange(kind: StatsRange, dateISO: string): { from: string; to: string; label: string } {
  if (kind === "day") {
    return { from: dateISO, to: dateISO, label: dateISO };
  }
  if (kind === "week") {
    const bounds = weekBounds(dateISO);
    return { ...bounds, label: `${bounds.from} – ${bounds.to}` };
  }
  const bounds = monthBounds(dateISO);
  return { ...bounds, label: formatInTimeZone(fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE), SHOP_TIMEZONE, "MMMM yyyy") };
}

function appointmentMinutes(row: Appointment): number {
  return Math.max(0, differenceInMinutes(parseISO(row.end_time), parseISO(row.start_time)));
}

function blockMinutes(row: TimeBlock): number {
  return Math.max(0, differenceInMinutes(parseISO(row.end_time), parseISO(row.start_time)));
}

function openMinutesForBarber(dateISO: string, barber: Barber, breakMinutes: number): number {
  const weekday = getBangkokWeekday(dateISO);
  if (barber.off_days.includes(weekday)) return 0;
  const { open, close } = getShopHours(dateISO);
  const openAt = fromZonedTime(`${dateISO}T${open}:00`, SHOP_TIMEZONE);
  const closeAt = fromZonedTime(`${dateISO}T${close}:00`, SHOP_TIMEZONE);
  const total = Math.max(0, differenceInMinutes(closeAt, openAt));
  return Math.max(0, total - breakMinutes);
}

function recurringBreakMinutes(dateISO: string, barberId: string, breaks: { barberId: string; weekday: number; startTime: string; endTime: string }[]): number {
  const weekday = getBangkokWeekday(dateISO);
  let minutes = 0;
  for (const item of breaks) {
    if (item.barberId !== barberId || item.weekday !== weekday) continue;
    const start = fromZonedTime(`${dateISO}T${item.startTime}:00`, SHOP_TIMEZONE);
    const end = fromZonedTime(`${dateISO}T${item.endTime}:00`, SHOP_TIMEZONE);
    minutes += Math.max(0, differenceInMinutes(end, start));
  }
  return minutes;
}

function hourInBangkok(iso: string): number {
  return Number(formatInTimeZone(parseISO(iso), SHOP_TIMEZONE, "H"));
}

function overlapsHour(startIso: string, endIso: string, hour: number, dateISO: string): number {
  const hourStart = fromZonedTime(`${dateISO}T${String(hour).padStart(2, "0")}:00:00`, SHOP_TIMEZONE);
  const hourEnd = addMinutes(hourStart, 60);
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const overlapStart = start > hourStart ? start : hourStart;
  const overlapEnd = end < hourEnd ? end : hourEnd;
  if (overlapEnd <= overlapStart) return 0;
  return differenceInMinutes(overlapEnd, overlapStart);
}

export async function getStatsReport(
  kind: StatsRange,
  dateISO: string,
  staff: StaffAuth,
): Promise<StatsReport> {
  parseDateISO(dateISO);
  const rangeMeta = resolveRange(kind, dateISO);
  const fromRange = dayRangeUtc(rangeMeta.from);
  const toRange = dayRangeUtc(rangeMeta.to);

  const store = getStore();
  const allBarbers = await listBarbers(staff.shopId);
  const barbers =
    staff.role === "super_admin"
      ? allBarbers
      : allBarbers.filter((b) => b.id === staff.barberId);

  const barberIds = new Set(barbers.map((b) => b.id));
  const [appointments, blocks, allBreaks] = await Promise.all([
    store.listAppointmentsInRange(fromRange.from, toRange.to),
    store.listDayBlocks(fromRange.from, toRange.to),
    Promise.all(barbers.map((b) => store.listRecurringBreaks(b.id))),
  ]);

  const breaksFlat = barbers.flatMap((barber, index) =>
    (allBreaks[index] ?? []).map((item) => ({
      barberId: barber.id,
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
    })),
  );

  const scopedAppointments = appointments.filter((a) => barberIds.has(a.barber_id));
  const scopedBlocks = blocks.filter((b) => barberIds.has(b.barber_id));

  const occupying = scopedAppointments.filter((a) => isOccupyingStatus(a.status));
  const phones = new Set(occupying.map((a) => a.customer_phone));

  const priorAppointments = await store.listAppointmentsInRange(
    new Date(0),
    new Date(fromRange.from.getTime() - 1),
  );
  const priorPhones = new Set(
    priorAppointments
      .filter((a) => barberIds.has(a.barber_id) && isOccupyingStatus(a.status))
      .map((a) => a.customer_phone),
  );
  const newCustomers = [...phones].filter((p) => !priorPhones.has(p)).length;

  let availableMinutes = 0;
  let occupiedMinutes = 0;
  const dayList = datesInRange(rangeMeta.from, rangeMeta.to);

  for (const dayISO of dayList) {
    for (const barber of barbers) {
      const breakMin = recurringBreakMinutes(dayISO, barber.id, breaksFlat);
      availableMinutes += openMinutesForBarber(dayISO, barber, breakMin);
    }
  }

  for (const row of occupying) {
    occupiedMinutes += appointmentMinutes(row);
  }
  for (const row of scopedBlocks) {
    occupiedMinutes += blockMinutes(row);
  }

  const totals: StatsTotals = {
    uniqueCustomers: phones.size,
    booked: scopedAppointments.length,
    cancelled: scopedAppointments.filter((a) => a.status === "cancelled").length,
    completed: scopedAppointments.filter((a) => a.status === "completed").length,
    noShow: scopedAppointments.filter((a) => a.status === "no_show").length,
    walkIns: scopedBlocks.length,
    newCustomers,
    utilizationPct: availableMinutes > 0 ? Math.round((occupiedMinutes / availableMinutes) * 100) : 0,
  };

  const shopHoursSet = new Set<number>();
  for (const dayISO of dayList) {
    const { open, close } = getShopHours(dayISO);
    const openH = Number(open.split(":")[0]);
    const closeH = Number(close.split(":")[0]);
    for (let h = openH; h < closeH; h += 1) shopHoursSet.add(h);
  }
  const hours = [...shopHoursSet].sort((a, b) => a - b);

  const byHour: StatsHourRow[] = hours.map((hour) => {
    let booked = 0;
    let walkIn = 0;
    for (const dayISO of dayList) {
      for (const row of occupying) {
        if (formatInTimeZone(parseISO(row.start_time), SHOP_TIMEZONE, "yyyy-MM-dd") !== dayISO) continue;
        booked += overlapsHour(row.start_time, row.end_time, hour, dayISO);
      }
      for (const row of scopedBlocks) {
        if (formatInTimeZone(parseISO(row.start_time), SHOP_TIMEZONE, "yyyy-MM-dd") !== dayISO) continue;
        walkIn += overlapsHour(row.start_time, row.end_time, hour, dayISO);
      }
    }
    const capacity = barbers.length * 60;
    const free = Math.max(0, capacity - booked - walkIn);
    return { hour, booked, walkIn, free };
  });

  const byBarber: StatsBarberRow[] = barbers.map((barber) => {
    const rows = scopedAppointments.filter((a) => a.barber_id === barber.id);
    const mins = rows
      .filter((a) => isOccupyingStatus(a.status))
      .reduce((sum, a) => sum + appointmentMinutes(a), 0);
    return {
      barberId: barber.id,
      name: barber.name,
      booked: rows.length,
      completed: rows.filter((a) => a.status === "completed").length,
      cancelled: rows.filter((a) => a.status === "cancelled").length,
      minutes: mins,
    };
  });

  const trend: StatsTrendRow[] = dayList.map((dayISO) => {
    const rows = scopedAppointments.filter(
      (a) => formatInTimeZone(parseISO(a.start_time), SHOP_TIMEZONE, "yyyy-MM-dd") === dayISO,
    );
    return {
      dateISO: dayISO,
      booked: rows.length,
      completed: rows.filter((a) => a.status === "completed").length,
      cancelled: rows.filter((a) => a.status === "cancelled").length,
    };
  });

  const barberName = new Map(barbers.map((b) => [b.id, b.name]));
  const blocksOut: StatsBlockRow[] = scopedBlocks.map((row) => ({
    barberId: row.barber_id,
    barberName: barberName.get(row.barber_id) ?? "",
    start: row.start_time,
    end: row.end_time,
    reason: row.reason,
  }));

  return {
    range: { from: rangeMeta.from, to: rangeMeta.to, label: rangeMeta.label, kind },
    totals,
    byHour,
    byBarber,
    trend,
    blocks: blocksOut,
  };
}
