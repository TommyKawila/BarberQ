import { addDays, addMinutes, differenceInMinutes, endOfMonth, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { isShopOperatorRole, type StaffAuth } from "@/lib/admin-auth";
import { isOccupyingStatus } from "@/lib/appointment-status";
import { getStore } from "@/lib/data";
import { listBarbers } from "@/lib/services/booking-service";
import {
  dayRangeUtc,
  getBangkokWeekday,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { normalizeShopHours } from "@/lib/shop/shop-hours";
import type { Appointment, Barber, TimeBlock } from "@/types/booking";

export type StatsRange = "day" | "week" | "month";

export interface StatsBySource {
  line: number;
  phone: number;
  chat: number;
  walk_in: number;
}

export interface StatsTotals {
  uniqueCustomers: number;
  booked: number;
  cancelled: number;
  completed: number;
  noShow: number;
  left: number;
  walkIns: number;
  /** P8: subset of walkIns that came from QR queue (via_qr). */
  qrWalkIns: number;
  newCustomers: number;
  returningCustomers: number;
  returningRatePct: number | null;
  cancelNoShowRatePct: number | null;
  /**
   * No-show rate among finished non-walk-in visits:
   * no_show / (completed + no_show). Cancelled and still-confirmed are excluded.
   */
  noShowRatePct: number | null;
  utilizationPct: number;
  revenueBaht: number;
  waitMinutesAvg: number | null;
  bySource: StatsBySource;
}

export interface StatsComparison {
  completedDelta: number;
  completedDeltaPct: number | null;
  revenueDelta: number;
  returningRateDeltaPct: number | null;
  waitMinutesDelta: number | null;
  cutoffApplied: boolean;
  previous: {
    from: string;
    to: string;
    completed: number;
    revenueBaht: number;
    returningRatePct: number | null;
    waitMinutesAvg: number | null;
  };
}

export interface StatsHourRow {
  hour: number;
  booked: number;
  walkIn: number;
  free: number;
  blocked: number;
  /** Chair occupied % for this hour across barbers/days in range */
  chairBusyPct: number;
}

export interface StatsBarberRow {
  barberId: string;
  name: string;
  booked: number;
  completed: number;
  cancelled: number;
  minutes: number;
  revenueBaht: number;
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

export interface StatsInsight {
  /** Machine key for UI templates */
  kind: "peak_hour" | "quiet_hour" | "trend_up" | "trend_down" | "empty";
  hour?: number;
  completed?: number;
  prevCompleted?: number;
}

export interface StatsReport {
  range: { from: string; to: string; label: string; kind: StatsRange; displayLabel: string };
  totals: StatsTotals;
  comparison: StatsComparison;
  byHour: StatsHourRow[];
  byBarber: StatsBarberRow[];
  trend: StatsTrendRow[];
  blocks: StatsBlockRow[];
  insight: StatsInsight;
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

function thaiShortDate(dateISO: string): string {
  const d = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  const day = formatInTimeZone(d, SHOP_TIMEZONE, "d");
  const monthNum = Number(formatInTimeZone(d, SHOP_TIMEZONE, "M"));
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${day} ${months[monthNum - 1]}`;
}

function resolveRange(kind: StatsRange, dateISO: string): { from: string; to: string; label: string; displayLabel: string } {
  if (kind === "day") {
    return { from: dateISO, to: dateISO, label: dateISO, displayLabel: thaiShortDate(dateISO) };
  }
  if (kind === "week") {
    const bounds = weekBounds(dateISO);
    return {
      ...bounds,
      label: `${bounds.from} – ${bounds.to}`,
      displayLabel: `${thaiShortDate(bounds.from)}–${thaiShortDate(bounds.to)}`,
    };
  }
  const bounds = monthBounds(dateISO);
  const anchor = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  const monthNum = Number(formatInTimeZone(anchor, SHOP_TIMEZONE, "M"));
  const year = formatInTimeZone(anchor, SHOP_TIMEZONE, "yyyy");
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return {
    ...bounds,
    label: formatInTimeZone(anchor, SHOP_TIMEZONE, "MMMM yyyy"),
    displayLabel: `${months[monthNum - 1]} ${year}`,
  };
}

function previousRange(
  kind: StatsRange,
  fromISO: string,
  toISO: string,
): { from: string; to: string } {
  if (kind === "day") {
    const prev = formatInTimeZone(
      subDays(fromZonedTime(`${fromISO}T12:00:00`, SHOP_TIMEZONE), 1),
      SHOP_TIMEZONE,
      "yyyy-MM-dd",
    );
    return { from: prev, to: prev };
  }
  if (kind === "week") {
    const prevFrom = formatInTimeZone(
      subDays(fromZonedTime(`${fromISO}T12:00:00`, SHOP_TIMEZONE), 7),
      SHOP_TIMEZONE,
      "yyyy-MM-dd",
    );
    const prevTo = formatInTimeZone(
      subDays(fromZonedTime(`${toISO}T12:00:00`, SHOP_TIMEZONE), 7),
      SHOP_TIMEZONE,
      "yyyy-MM-dd",
    );
    return { from: prevFrom, to: prevTo };
  }
  const anchor = fromZonedTime(`${fromISO}T12:00:00`, SHOP_TIMEZONE);
  const prevMonth = subMonths(anchor, 1);
  const prevFrom = formatInTimeZone(startOfMonth(prevMonth), SHOP_TIMEZONE, "yyyy-MM-dd");
  const prevTo = formatInTimeZone(endOfMonth(prevMonth), SHOP_TIMEZONE, "yyyy-MM-dd");
  return { from: prevFrom, to: prevTo };
}

function appointmentMinutes(row: Appointment): number {
  return Math.max(0, differenceInMinutes(parseISO(row.end_time), parseISO(row.start_time)));
}

function blockMinutes(row: TimeBlock): number {
  return Math.max(0, differenceInMinutes(parseISO(row.end_time), parseISO(row.start_time)));
}

function openMinutesForBarber(
  dateISO: string,
  barber: Barber,
  breakMinutes: number,
  shopHours: ReturnType<typeof normalizeShopHours>,
): number {
  const weekday = getBangkokWeekday(dateISO);
  if (barber.off_days.includes(weekday)) return 0;
  const hours = resolveShopHoursForDate(shopHours, dateISO);
  if (!hours) return 0;
  const { open, close } = hours;
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

function applyCutoff(rows: Appointment[], cutoff: Date | null): Appointment[] {
  if (!cutoff) return rows;
  return rows.filter((a) => parseISO(a.start_time).getTime() <= cutoff.getTime());
}

function applyBlockCutoff(rows: TimeBlock[], cutoff: Date | null): TimeBlock[] {
  if (!cutoff) return rows;
  return rows.filter((b) => parseISO(b.start_time).getTime() <= cutoff.getTime());
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function computeWaitAvg(completed: Appointment[]): number | null {
  const waits: number[] = [];
  for (const row of completed) {
    if (row.source !== "walk_in") continue;
    const mins = differenceInMinutes(parseISO(row.start_time), parseISO(row.created_at));
    if (mins >= 0 && mins < 24 * 60) waits.push(mins);
  }
  if (!waits.length) return null;
  return Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
}

/** Legacy pre-P3 walk-ins were blocked_slots with reason 'walk-in'. */
export function isLegacyWalkInBlock(reason: string | null | undefined): boolean {
  return (reason ?? "").trim().toLowerCase() === "walk-in";
}

interface TotalsInput {
  appointments: Appointment[];
  blocks: TimeBlock[];
  barbers: Barber[];
  dayList: string[];
  breaksFlat: { barberId: string; weekday: number; startTime: string; endTime: string }[];
  shopHours: ReturnType<typeof normalizeShopHours>;
  priorPhones: Set<string>;
}

function computeTotals(input: TotalsInput): StatsTotals {
  const { appointments, blocks, barbers, dayList, breaksFlat, shopHours, priorPhones } = input;
  const occupying = appointments.filter((a) => isOccupyingStatus(a.status));
  const phones = new Set(
    occupying
      .filter((a) => a.source !== "walk_in" && a.customer_phone)
      .map((a) => a.customer_phone as string),
  );
  const newCustomers = [...phones].filter((p) => !priorPhones.has(p)).length;
  const returningCustomers = Math.max(0, phones.size - newCustomers);
  const returningRatePct =
    phones.size > 0 ? Math.round((returningCustomers / phones.size) * 100) : null;

  // Channel / walk-in cards: exclude cancelled (voided). No-shows still count —
  // they were real bookings that did not arrive.
  const channelRows = appointments.filter((a) => a.status !== "cancelled");
  const bySource: StatsBySource = { line: 0, phone: 0, chat: 0, walk_in: 0 };
  for (const row of channelRows) {
    const src = row.source ?? "line";
    if (src in bySource) bySource[src as keyof StatsBySource] += 1;
  }
  const walkInAppointments = channelRows.filter((a) => a.source === "walk_in");
  const legacyWalkInBlocks = blocks.filter((b) => isLegacyWalkInBlock(b.reason));
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const completedRows = appointments.filter((a) => a.status === "completed");
  const completed = completedRows.length;
  const noShow = appointments.filter(
    (a) => a.source !== "walk_in" && a.status === "no_show",
  ).length;
  const booked = appointments.length;
  // Loss rate over every booking in range (incl. cancelled + still-confirmed).
  const cancelNoShowRatePct =
    booked > 0 ? Math.round(((cancelled + noShow) / booked) * 100) : null;
  // Among finished non-walk-in visits (came vs no-show) — cancelled/confirmed excluded.
  const finishedNonWalkIn = appointments.filter(
    (a) =>
      a.source !== "walk_in" &&
      (a.status === "completed" || a.status === "no_show"),
  );
  const noShowRatePct =
    finishedNonWalkIn.length > 0
      ? Math.round((noShow / finishedNonWalkIn.length) * 100)
      : null;

  let availableMinutes = 0;
  let occupiedMinutes = 0;
  for (const dayISO of dayList) {
    for (const barber of barbers) {
      const breakMin = recurringBreakMinutes(dayISO, barber.id, breaksFlat);
      availableMinutes += openMinutesForBarber(dayISO, barber, breakMin, shopHours);
    }
  }
  for (const row of occupying) occupiedMinutes += appointmentMinutes(row);
  for (const row of blocks) occupiedMinutes += blockMinutes(row);

  const revenueBaht = completedRows.reduce((sum, a) => sum + (a.price_baht ?? 0), 0);

  return {
    uniqueCustomers: phones.size,
    booked,
    cancelled,
    completed,
    noShow,
    left: appointments.filter((a) => a.status === "left").length,
    // Real walk-in bookings (P3+) plus legacy blocked_slots reason 'walk-in' only.
    walkIns: walkInAppointments.length + legacyWalkInBlocks.length,
    qrWalkIns: walkInAppointments.filter((a) => a.via_qr).length,
    newCustomers,
    returningCustomers,
    returningRatePct,
    cancelNoShowRatePct,
    noShowRatePct,
    utilizationPct: availableMinutes > 0 ? Math.round((occupiedMinutes / availableMinutes) * 100) : 0,
    revenueBaht,
    waitMinutesAvg: computeWaitAvg(completedRows),
    bySource,
  };
}

function buildInsight(
  byHour: StatsHourRow[],
  trend: StatsTrendRow[],
  totals: StatsTotals,
): StatsInsight {
  // Peak/quiet follow the hero metric (ตัดเสร็จ). No completed → no peak hour.
  if (totals.completed === 0) return { kind: "empty" };
  if (byHour.length) {
    const peak = [...byHour].sort((a, b) => b.booked + b.walkIn - (a.booked + a.walkIn))[0];
    const quiet = [...byHour].sort((a, b) => a.booked + a.walkIn - (b.booked + b.walkIn))[0];
    if (peak && peak.booked + peak.walkIn > 0) {
      return { kind: "peak_hour", hour: peak.hour };
    }
    if (quiet) return { kind: "quiet_hour", hour: quiet.hour };
  }
  if (trend.length >= 2) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (last.completed > prev.completed) {
      return { kind: "trend_up", completed: last.completed, prevCompleted: prev.completed };
    }
    if (last.completed < prev.completed) {
      return { kind: "trend_down", completed: last.completed, prevCompleted: prev.completed };
    }
  }
  return { kind: "empty" };
}

/** Shift period navigation anchor */
export function shiftStatsAnchor(kind: StatsRange, dateISO: string, direction: -1 | 1): string {
  parseDateISO(dateISO);
  const noon = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  if (kind === "day") {
    return formatInTimeZone(addDays(noon, direction), SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  if (kind === "week") {
    return formatInTimeZone(addDays(noon, direction * 7), SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  const shifted = direction > 0 ? addDays(endOfMonth(noon), 1) : subMonths(startOfMonth(noon), 0);
  if (direction < 0) {
    return formatInTimeZone(startOfMonth(subMonths(noon, 1)), SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  return formatInTimeZone(startOfMonth(shifted), SHOP_TIMEZONE, "yyyy-MM-dd");
}

export async function getStatsReport(
  kind: StatsRange,
  dateISO: string,
  staff: StaffAuth,
  now: Date = new Date(),
): Promise<StatsReport> {
  parseDateISO(dateISO);
  const rangeMeta = resolveRange(kind, dateISO);
  const fromRange = dayRangeUtc(rangeMeta.from);
  const toRange = dayRangeUtc(rangeMeta.to);

  const store = getStore();
  const allBarbers = await listBarbers(staff.shopId);
  const barbers =
    isShopOperatorRole(staff.role)
      ? allBarbers
      : allBarbers.filter((b) => b.id === staff.barberId);
  const shopSettings = await store.getShopSettings(staff.shopId);
  const shopHours = normalizeShopHours(shopSettings.hours);

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

  const todayISO = formatInTimeZone(now, SHOP_TIMEZONE, "yyyy-MM-dd");
  const rangeIncludesNow = rangeMeta.from <= todayISO && todayISO <= rangeMeta.to;
  // Same-time cutoff applies to the *previous* period for fair comparison.
  // Current period shows the full selected range (including later-today bookings).
  const cutoff = rangeIncludesNow ? now : null;

  const scopedAppointments = appointments.filter((a) => barberIds.has(a.barber_id));
  const scopedBlocks = blocks.filter((b) => barberIds.has(b.barber_id));

  const priorAppointments = await store.listAppointmentsInRange(
    new Date(0),
    new Date(fromRange.from.getTime() - 1),
  );
  const priorPhones = new Set(
    priorAppointments
      .filter(
        (a) =>
          barberIds.has(a.barber_id) &&
          isOccupyingStatus(a.status) &&
          a.source !== "walk_in" &&
          a.customer_phone,
      )
      .map((a) => a.customer_phone as string),
  );

  const dayList = datesInRange(rangeMeta.from, rangeMeta.to);
  const totals = computeTotals({
    appointments: scopedAppointments,
    blocks: scopedBlocks,
    barbers,
    dayList,
    breaksFlat,
    shopHours,
    priorPhones,
  });

  // Previous period with same-time cutoff
  const prevMeta = previousRange(kind, rangeMeta.from, rangeMeta.to);
  const prevFromRange = dayRangeUtc(prevMeta.from);
  const prevToRange = dayRangeUtc(prevMeta.to);
  const [prevAppointmentsRaw, prevBlocksRaw] = await Promise.all([
    store.listAppointmentsInRange(prevFromRange.from, prevToRange.to),
    store.listDayBlocks(prevFromRange.from, prevToRange.to),
  ]);

  let prevCutoff: Date | null = null;
  if (cutoff) {
    const clock = formatInTimeZone(now, SHOP_TIMEZONE, "HH:mm:ss.SSS");
    // Map cutoff to previous period's corresponding calendar day
    if (kind === "day") {
      prevCutoff = fromZonedTime(`${prevMeta.from}T${clock}`, SHOP_TIMEZONE);
    } else {
      // Same offset from period start
      const offsetMs = now.getTime() - fromZonedTime(`${rangeMeta.from}T00:00:00`, SHOP_TIMEZONE).getTime();
      prevCutoff = new Date(fromZonedTime(`${prevMeta.from}T00:00:00`, SHOP_TIMEZONE).getTime() + offsetMs);
    }
  }

  const prevAppointments = applyCutoff(
    prevAppointmentsRaw.filter((a) => barberIds.has(a.barber_id)),
    prevCutoff,
  );
  const prevBlocks = applyBlockCutoff(
    prevBlocksRaw.filter((b) => barberIds.has(b.barber_id)),
    prevCutoff,
  );
  const prevPrior = await store.listAppointmentsInRange(
    new Date(0),
    new Date(prevFromRange.from.getTime() - 1),
  );
  const prevPriorPhones = new Set(
    prevPrior
      .filter(
        (a) =>
          barberIds.has(a.barber_id) &&
          isOccupyingStatus(a.status) &&
          a.source !== "walk_in" &&
          a.customer_phone,
      )
      .map((a) => a.customer_phone as string),
  );
  const prevDayList = datesInRange(prevMeta.from, prevMeta.to);
  const prevTotals = computeTotals({
    appointments: prevAppointments,
    blocks: prevBlocks,
    barbers,
    dayList: prevDayList,
    breaksFlat,
    shopHours,
    priorPhones: prevPriorPhones,
  });

  const comparison: StatsComparison = {
    completedDelta: totals.completed - prevTotals.completed,
    completedDeltaPct: pctDelta(totals.completed, prevTotals.completed),
    revenueDelta: totals.revenueBaht - prevTotals.revenueBaht,
    returningRateDeltaPct:
      totals.returningRatePct != null && prevTotals.returningRatePct != null
        ? totals.returningRatePct - prevTotals.returningRatePct
        : null,
    waitMinutesDelta:
      totals.waitMinutesAvg != null && prevTotals.waitMinutesAvg != null
        ? totals.waitMinutesAvg - prevTotals.waitMinutesAvg
        : null,
    cutoffApplied: Boolean(cutoff),
    previous: {
      from: prevMeta.from,
      to: prevMeta.to,
      completed: prevTotals.completed,
      revenueBaht: prevTotals.revenueBaht,
      returningRatePct: prevTotals.returningRatePct,
      waitMinutesAvg: prevTotals.waitMinutesAvg,
    },
  };

  const shopHoursSet = new Set<number>();
  for (const dayISO of dayList) {
    const resolved = resolveShopHoursForDate(shopHours, dayISO);
    if (!resolved) continue;
    const openH = Number(resolved.open.split(":")[0]);
    const closeH = Number(resolved.close.split(":")[0]);
    for (let h = openH; h < closeH; h += 1) shopHoursSet.add(h);
  }
  const hours = [...shopHoursSet].sort((a, b) => a - b);
  const occupyingScoped = scopedAppointments.filter((a) => isOccupyingStatus(a.status));

  const byHour: StatsHourRow[] = hours.map((hour) => {
    let booked = 0;
    let walkIn = 0;
    let blocked = 0;
    for (const dayISO of dayList) {
      for (const row of occupyingScoped) {
        if (formatInTimeZone(parseISO(row.start_time), SHOP_TIMEZONE, "yyyy-MM-dd") !== dayISO) continue;
        const mins = overlapsHour(row.start_time, row.end_time, hour, dayISO);
        if (row.source === "walk_in") walkIn += mins;
        else booked += mins;
      }
      for (const row of scopedBlocks) {
        if (formatInTimeZone(parseISO(row.start_time), SHOP_TIMEZONE, "yyyy-MM-dd") !== dayISO) continue;
        const mins = overlapsHour(row.start_time, row.end_time, hour, dayISO);
        if (isLegacyWalkInBlock(row.reason)) walkIn += mins;
        else blocked += mins;
      }
    }
    const capacity = Math.max(1, barbers.length * 60 * dayList.length);
    const busy = booked + walkIn + blocked;
    const free = Math.max(0, barbers.length * 60 * dayList.length - busy);
    return {
      hour,
      booked,
      walkIn,
      free,
      blocked,
      chairBusyPct: Math.round((busy / capacity) * 100),
    };
  });

  const byBarber: StatsBarberRow[] = barbers.map((barber) => {
    const rows = scopedAppointments.filter((a) => a.barber_id === barber.id);
    const completedRows = rows.filter((a) => a.status === "completed");
    // Served minutes only — same rule as "เสร็จ" (exclude no_show / left / cancelled).
    const mins = completedRows.reduce((sum, a) => sum + appointmentMinutes(a), 0);
    const revenueBaht = completedRows.reduce((sum, a) => sum + (a.price_baht ?? 0), 0);
    return {
      barberId: barber.id,
      name: barber.name,
      booked: rows.length,
      completed: completedRows.length,
      cancelled: rows.filter((a) => a.status === "cancelled").length,
      minutes: mins,
      revenueBaht,
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
    range: {
      from: rangeMeta.from,
      to: rangeMeta.to,
      label: rangeMeta.label,
      kind,
      displayLabel: rangeMeta.displayLabel,
    },
    totals,
    comparison,
    byHour,
    byBarber,
    trend,
    blocks: blocksOut,
    insight: buildInsight(byHour, trend, totals),
  };
}
