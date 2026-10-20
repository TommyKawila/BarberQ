import { addMinutes } from "date-fns";
import { getStore, StoreConflict } from "@/lib/data";
import {
  canCancelAt,
  CANCEL_LEAD_MINUTES,
  dateISOFromInstant,
  dayRangeUtc,
  generateSlots,
  getBookableDates,
  intervalsOverlap,
  isLate,
  MAX_RESCHEDULE_COUNT,
  recurringBreaksForDate,
} from "@/lib/services/slot-service";
import { isBlockingStatus } from "@/lib/appointment-status";
import { selectAdminBoardBarbers } from "@/lib/barber/board-visibility";
import { scheduleBookingReminder } from "@/lib/reminders/schedule-booking";
import { normalizeShopHours } from "@/lib/shop/shop-hours";
import { isShopOperatorRole, type StaffAuth } from "@/lib/admin-auth";
import { countCustomerNoShows } from "@/lib/admin/customer-no-show";
import { isShopClosedNow, nextShopOpenLabel } from "@/lib/admin/free-barbers";
import { isBarberOffToday } from "@/lib/admin/today-queue-cards";
import type {
  AdminColumn,
  AdminSlot,
  Appointment,
  Barber,
  CreateBookingInput,
  CreateStaffBookingInput,
  Slot,
  TimeBlock,
} from "@/types/booking";

export class BookingError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "BookingError";
    this.code = code;
    this.status = status;
  }
}

function mapStoreError(error: unknown): BookingError {
  if (error instanceof StoreConflict) {
    const map: Record<string, [string, number]> = {
      BARBER_NOT_FOUND: ["Barber not found", 404],
      SLOT_TAKEN: ["This slot is already booked", 409],
      SLOT_BLOCKED: ["This slot is blocked", 409],
      TOO_LATE: [
        `Cancellations must be at least ${CANCEL_LEAD_MINUTES} minutes before start time`,
        400,
      ],
      NOT_OWNER: ["You can only cancel your own booking", 403],
      NOT_CANCELLABLE: ["This booking cannot be cancelled", 400],
      NOT_RESCHEDULABLE: ["This booking cannot be rescheduled", 400],
      RESCHEDULE_LIMIT: ["This booking has already been rescheduled once", 400],
      NOT_FOUND: ["Appointment not found", 404],
      INVALID_RANGE: ["Invalid time range", 400],
      INVALID_OUTCOME: ["Cannot mark outcome yet", 400],
      INVALID_SOURCE: ["Invalid booking source", 400],
      LINE_ID_TAKEN: ["This LINE account is already linked", 409],
      HAS_FUTURE_BOOKINGS: ["Barber has future bookings", 409],
    };
    const entry = map[error.code];
    if (entry) return new BookingError(error.code, entry[0], entry[1]);
  }
  const message = error instanceof Error ? error.message : "Unexpected booking error";
  return new BookingError("INTERNAL", message, 500);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function sortBarbers(barbers: Barber[]): Barber[] {
  return barbers.sort((a, b) => a.name.localeCompare(b.name, "th"));
}

export async function listBarbers(shopId?: string): Promise<Barber[]> {
  try {
    const barbers = shopId
      ? await getStore().listBarbersByShop(shopId)
      : await getStore().listBarbers();
    return sortBarbers(barbers);
  } catch (error) {
    throw mapStoreError(error);
  }
}

function isBarberBookable(barber: Barber): boolean {
  return barber.is_active !== false && barber.is_bookable !== false;
}

export async function listBookableBarbers(shopId: string): Promise<Barber[]> {
  const barbers = await listBarbers(shopId);
  return barbers.filter(isBarberBookable);
}

async function shopHoursForBarber(barber: Barber) {
  if (!barber.shop_id) return normalizeShopHours(null);
  const settings = await getStore().getShopSettings(barber.shop_id);
  return normalizeShopHours(settings.hours);
}

export async function getAvailableSlots(
  barberId: string,
  dateISO: string,
  now: Date = new Date(),
  opts?: { excludeAppointmentId?: string },
): Promise<Slot[]> {
  if (!isUuid(barberId)) {
    throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
  }
  const bookable = getBookableDates(now);
  if (!bookable.includes(dateISO)) {
    throw new BookingError("OUT_OF_WINDOW", "Date is outside the 7-day booking window", 400);
  }

  try {
    const store = getStore();
    const barber = await store.getBarber(barberId);
    if (!barber) throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    if (!isBarberBookable(barber)) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const shopHours = await shopHoursForBarber(barber);
    const range = dayRangeUtc(dateISO);
    const [busyRaw, recurringBreaks] = await Promise.all([
      store.getBusyIntervals(barberId, range.from, range.to),
      store.listRecurringBreaks(barberId),
    ]);
    let busy = busyRaw;
    if (opts?.excludeAppointmentId) {
      const apt = await store.getAppointment(opts.excludeAppointmentId);
      if (apt && apt.barber_id === barberId) {
        busy = busyRaw.filter(
          (row) =>
            !(row.start_time === apt.start_time && row.end_time === apt.end_time),
        );
      }
    }
    return generateSlots({ dateISO, barber, busy, recurringBreaks, shopHours, now });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

/**
 * Availability for every bookable barber on a date in one round-trip.
 * Uses the same busy rules as getAvailableSlots (blocking appointments + blocks + breaks).
 */
export async function getAvailableSlotsForShop(
  shopId: string,
  dateISO: string,
  now: Date = new Date(),
): Promise<Record<string, Slot[]>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
  }
  const bookable = getBookableDates(now);
  if (!bookable.includes(dateISO)) {
    throw new BookingError("OUT_OF_WINDOW", "Date is outside the 7-day booking window", 400);
  }

  try {
    const store = getStore();
    const barbers = await listBookableBarbers(shopId);
    if (barbers.length === 0) return {};

    const settings = await store.getShopSettings(shopId);
    const shopHours = normalizeShopHours(settings.hours);
    const range = dayRangeUtc(dateISO);
    const barberIds = new Set(barbers.map((barber) => barber.id));

    const [allBooked, allBlocked, allBreaks] = await Promise.all([
      store.listDayAppointments(range.from, range.to),
      store.listDayBlocks(range.from, range.to),
      Promise.all(barbers.map((barber) => store.listRecurringBreaks(barber.id))),
    ]);

    const booked = allBooked.filter(
      (row) => barberIds.has(row.barber_id) && isBlockingStatus(row.status),
    );
    const blocked = allBlocked.filter((row) => barberIds.has(row.barber_id));

    const result: Record<string, Slot[]> = {};
    barbers.forEach((barber, index) => {
      const busy = [
        ...booked
          .filter((row) => row.barber_id === barber.id)
          .map((row) => ({ start_time: row.start_time, end_time: row.end_time })),
        ...blocked
          .filter((row) => row.barber_id === barber.id)
          .map((row) => ({ start_time: row.start_time, end_time: row.end_time })),
      ];
      result[barber.id] = generateSlots({
        dateISO,
        barber,
        busy,
        recurringBreaks: allBreaks[index] ?? [],
        shopHours,
        now,
      });
    });
    return result;
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function createBooking(
  input: CreateBookingInput,
  shopIdHint?: string,
): Promise<Appointment> {
  const name = input.customerName.trim();
  const phone = input.customerPhone.trim();
  const customerRef = input.customerRef.trim();

  if (!isUuid(input.barberId)) {
    throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
  }
  if (!name) {
    throw new BookingError("INVALID_NAME", "Customer name is required", 400);
  }
  if (!/^0\d{8,9}$/.test(phone)) {
    throw new BookingError("INVALID_PHONE", "Enter a valid Thai phone number", 400);
  }
  if (!customerRef) {
    throw new BookingError("INVALID_CUSTOMER", "Customer reference is required", 400);
  }

  const start = new Date(input.startTime);
  if (Number.isNaN(start.getTime())) {
    throw new BookingError("INVALID_TIME", "Invalid start time", 400);
  }

  const now = new Date();
  if (start.getTime() <= now.getTime()) {
    throw new BookingError("SLOT_PAST", "Cannot book a past slot", 400);
  }

  const dateISO = dateISOFromInstant(start);
  const slots = await getAvailableSlots(input.barberId, dateISO, now);
  const match = slots.find((slot) => slot.startTime === start.toISOString());
  if (!match) {
    throw new BookingError("INVALID_SLOT", "Start time is not a valid slot", 400);
  }
  if (!match.available) {
    throw new BookingError("SLOT_TAKEN", "This slot is not available", 409);
  }

  try {
    const store = getStore();
    const barber = await store.getBarber(input.barberId);
    if (!barber) throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    if (!isBarberBookable(barber)) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const end = addMinutes(start, barber.slot_duration_minutes);
    const source = input.source ?? "line";
    const appointment = await store.createAppointment({
      barberId: input.barberId,
      customerRef,
      customerName: name,
      customerPhone: phone,
      startTime: start,
      endTime: end,
      customerLineId: input.customerLineId,
      source,
    });

    const shopId = shopIdHint ?? barber.shop_id ?? null;
    if (!shopId) return appointment;
    const settings = await store.getShopSettings(shopId);
    const preferred =
      input.reminderLeadMinutes === undefined
        ? settings.reminderLeadMinutes
        : input.reminderLeadMinutes;
    // Prefer request identity fields — RPC payloads may omit source/line id keys.
    return scheduleBookingReminder({
      shopId,
      shopRemindersEnabled: settings.remindersEnabled,
      appointment: {
        ...appointment,
        source: appointment.source ?? source,
        customer_line_id: appointment.customer_line_id ?? input.customerLineId ?? null,
      },
      preferredLeadMinutes: preferred,
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

function roundDownToFiveMinutes(date: Date): Date {
  const ms = 5 * 60_000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

/** Unique Walk-in #N per shop per Asia/Bangkok day (creation order via max existing #). */
export async function nextWalkInLabel(shopId: string, dayISO: string): Promise<string> {
  const range = dayRangeUtc(dayISO);
  const barbers = await getStore().listBarbersByShop(shopId);
  const barberIds = new Set(barbers.map((b) => b.id));
  const dayAppointments = await getStore().listDayAppointments(range.from, range.to);
  const walkIns = dayAppointments.filter(
    (a) => barberIds.has(a.barber_id) && a.source === "walk_in",
  );
  let maxN = 0;
  for (const row of walkIns) {
    const match = /^Walk-in #(\d+)$/i.exec((row.customer_name ?? "").trim());
    if (match) maxN = Math.max(maxN, Number(match[1]));
  }
  // Also advance past unlabeled walk-ins so gaps stay monotonic
  const next = Math.max(maxN, walkIns.length) + 1;
  return `Walk-in #${next}`;
}

export async function createStaffBooking(
  shopId: string,
  input: CreateStaffBookingInput,
  now: Date = new Date(),
): Promise<Appointment> {
  const source = input.source;
  if (source !== "phone" && source !== "chat" && source !== "walk_in") {
    throw new BookingError("INVALID_SOURCE", "Invalid booking source", 400);
  }
  if (!isUuid(input.barberId)) {
    throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
  }

  const barber = await assertBarberInShop(input.barberId, shopId);
  if (barber.is_active === false) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }

  let start = new Date(input.startTime);
  if (Number.isNaN(start.getTime())) {
    throw new BookingError("INVALID_TIME", "Invalid start time", 400);
  }

  const earliest = addMinutes(now, -30);
  if (start.getTime() < earliest.getTime()) {
    throw new BookingError("SLOT_PAST", "Cannot book a past slot", 400);
  }
  // Walk-in "start now": never keep a past grid-cell start (e.g. covering free
  // cell that began 20:30 when tapping at 20:54). Snap to the current 5-min bucket.
  if (source === "walk_in") {
    const hours = await shopHoursForBarber(barber);
    if (isBarberOffToday(barber, now)) {
      throw new BookingError("BARBER_OFF", "Barber is off today", 400);
    }
    // Only gate "start now" (near-now) walk-ins — scheduled staff bookings at a
    // future free cell (e.g. next-free offer) may still land after open.
    const deltaMs = start.getTime() - now.getTime();
    const isStartNow = deltaMs <= 0 || deltaMs < 2 * 60_000;
    if (isStartNow) {
      if (isShopClosedNow(hours, now)) {
        const openLabel = nextShopOpenLabel(hours, now);
        throw new BookingError(
          "SHOP_CLOSED",
          openLabel ? `Shop opens at ${openLabel}` : "Shop is closed",
          400,
        );
      }
      start = roundDownToFiveMinutes(now);
    }
  }

  let name = (input.customerName ?? "").trim();
  const phoneRaw = (input.customerPhone ?? "").trim();
  if (source === "walk_in") {
    if (!name) {
      name = await nextWalkInLabel(shopId, dateISOFromInstant(start));
    }
  } else if (!name) {
    throw new BookingError("INVALID_NAME", "Customer name is required", 400);
  }

  if (phoneRaw && !/^0\d{8,9}$/.test(phoneRaw)) {
    throw new BookingError("INVALID_PHONE", "Enter a valid Thai phone number", 400);
  }

  const defaultEnd = addMinutes(start, barber.slot_duration_minutes);
  let end = defaultEnd;
  if (input.endTime) {
    end = new Date(input.endTime);
    if (Number.isNaN(end.getTime()) || end <= start) {
      throw new BookingError("INVALID_RANGE", "Invalid time range", 400);
    }
    if (end.getTime() > defaultEnd.getTime()) {
      throw new BookingError("INVALID_RANGE", "End time exceeds slot duration", 400);
    }
  }

  try {
    return await getStore().createAppointment({
      barberId: input.barberId,
      customerRef: input.customerLineId?.trim() || null,
      customerName: name,
      customerPhone: phoneRaw || null,
      startTime: start,
      endTime: end,
      customerLineId: input.customerLineId?.trim() || null,
      source,
      viaQr: Boolean(input.viaQr),
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function findNextConflictEnd(
  barberId: string,
  start: Date,
  proposedEnd: Date,
): Promise<Date | null> {
  const busy = await getStore().getBusyIntervals(barberId, start, proposedEnd);
  let soonest: Date | null = null;
  for (const row of busy) {
    const busyStart = new Date(row.start_time);
    if (busyStart > start && busyStart < proposedEnd) {
      if (!soonest || busyStart < soonest) soonest = busyStart;
    }
  }
  return soonest;
}

export async function listCustomerBookings(customerLineId: string): Promise<Appointment[]> {
  const lineId = customerLineId.trim();
  if (!lineId) {
    throw new BookingError("INVALID_LINE_ID", "Line ID is required", 400);
  }
  try {
    return await getStore().listCustomerAppointments(lineId);
  } catch (error) {
    throw mapStoreError(error);
  }
}

export async function listCustomerBookingsForShop(
  customerLineId: string,
  shopId: string,
): Promise<Appointment[]> {
  const appointments = await listCustomerBookings(customerLineId);
  const barbers = await getStore().listBarbersByShop(shopId);
  const barberIds = new Set(barbers.map((b) => b.id));
  return appointments.filter((a) => barberIds.has(a.barber_id));
}

async function assertBarberInShop(barberId: string, shopId: string): Promise<Barber> {
  const barber = await getStore().getBarber(barberId);
  if (!barber || barber.shop_id !== shopId) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }
  return barber;
}

export async function createBookingForShop(
  shopId: string,
  input: CreateBookingInput,
): Promise<Appointment> {
  await assertBarberInShop(input.barberId, shopId);
  return createBooking(input, shopId);
}

export async function cancelBooking(
  appointmentId: string,
  customerRef: string,
): Promise<Appointment> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  if (!customerRef.trim()) {
    throw new BookingError("INVALID_CUSTOMER", "Customer reference is required", 400);
  }

  try {
    const store = getStore();
    const existing = await store.getAppointment(appointmentId);
    if (!existing) throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    if (!canCancelAt(existing.start_time)) {
      throw new BookingError(
        "TOO_LATE",
        `Cancellations must be at least ${CANCEL_LEAD_MINUTES} minutes before start time`,
        400,
      );
    }
    return await store.cancelAppointment(appointmentId, customerRef.trim());
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function staffCancelBooking(appointmentId: string): Promise<Appointment> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  try {
    return await getStore().staffCancelAppointment(appointmentId);
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function createBlock(input: {
  barberId: string;
  startTime: string;
  endTime: string;
  reason?: string;
}): Promise<TimeBlock> {
  if (!isUuid(input.barberId)) {
    throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
  }
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new BookingError("INVALID_RANGE", "Invalid time range", 400);
  }

  try {
    return await getStore().createBlock({
      barberId: input.barberId,
      startTime: start,
      endTime: end,
      reason: input.reason?.trim() || "walk-in",
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function removeBlock(id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new BookingError("INVALID_ID", "Invalid block id", 400);
  }
  try {
    await getStore().removeBlock(id);
  } catch (error) {
    throw mapStoreError(error);
  }
}

export async function cancelBookingByToken(token: string): Promise<Appointment> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new BookingError("INVALID_TOKEN", "Cancel token is required", 400);
  }
  try {
    const existing = await getStore().getAppointmentByCancelToken(trimmed);
    if (!existing) throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    if (!canCancelAt(existing.start_time)) {
      throw new BookingError(
        "TOO_LATE",
        `Cancellations must be at least ${CANCEL_LEAD_MINUTES} minutes before start time`,
        400,
      );
    }
    return await getStore().cancelAppointmentByToken(trimmed);
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export type RescheduleResult = {
  before: Appointment;
  after: Appointment;
};

async function validateRescheduleTarget(
  existing: Appointment,
  newBarberId: string,
  startTimeIso: string,
  now: Date,
  opts?: {
    requireLead?: boolean;
    requireRescheduleQuota?: boolean;
    /** Staff may move onto active-but-not-online-bookable barbers */
    staffMode?: boolean;
  },
): Promise<{ start: Date; end: Date }> {
  if (!isUuid(newBarberId)) {
    throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
  }
  if (existing.status !== "confirmed") {
    throw new BookingError("NOT_RESCHEDULABLE", "This booking cannot be rescheduled", 400);
  }
  if (opts?.requireRescheduleQuota !== false) {
    if ((existing.reschedule_count ?? 0) >= MAX_RESCHEDULE_COUNT) {
      throw new BookingError(
        "RESCHEDULE_LIMIT",
        "This booking has already been rescheduled once",
        400,
      );
    }
  }
  if (opts?.requireLead !== false && !canCancelAt(existing.start_time, now)) {
    throw new BookingError(
      "TOO_LATE",
      `Reschedule must be at least ${CANCEL_LEAD_MINUTES} minutes before start time`,
      400,
    );
  }

  const start = new Date(startTimeIso);
  if (Number.isNaN(start.getTime())) {
    throw new BookingError("INVALID_TIME", "Invalid start time", 400);
  }
  if (start.getTime() <= now.getTime()) {
    throw new BookingError("SLOT_PAST", "Cannot book a past slot", 400);
  }

  const barber = await getStore().getBarber(newBarberId);
  if (!barber || barber.is_active === false) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }
  if (!opts?.staffMode && !isBarberBookable(barber)) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }
  if (existing.barber_id) {
    const oldBarber = await getStore().getBarber(existing.barber_id);
    if (oldBarber?.shop_id && barber.shop_id && oldBarber.shop_id !== barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
  }

  const dateISO = dateISOFromInstant(start);
  if (opts?.staffMode) {
    // Board already showed a free slot — still re-check busy excluding self.
    const end = addMinutes(start, barber.slot_duration_minutes);
    const busy = await getStore().getBusyIntervals(newBarberId, start, end);
    const foreignConflict = busy.some((row) => {
      const isSelf =
        existing.barber_id === newBarberId &&
        row.start_time === existing.start_time &&
        row.end_time === existing.end_time;
      if (isSelf) return false;
      return intervalsOverlap(
        start,
        end,
        new Date(row.start_time),
        new Date(row.end_time),
      );
    });
    if (foreignConflict) {
      throw new BookingError("SLOT_TAKEN", "This slot is not available", 409);
    }
    return { start, end };
  }

  const slots = await getAvailableSlots(newBarberId, dateISO, now, {
    excludeAppointmentId: existing.id,
  });
  const match = slots.find((slot) => slot.startTime === start.toISOString());
  if (!match) {
    throw new BookingError("INVALID_SLOT", "Start time is not a valid slot", 400);
  }
  if (!match.available) {
    throw new BookingError("SLOT_TAKEN", "This slot is not available", 409);
  }

  return {
    start,
    end: addMinutes(start, barber.slot_duration_minutes),
  };
}

/** Customer self-reschedule via cancel_token. Max 1; 60-min lead on original. */
export async function rescheduleBookingByToken(
  token: string,
  newBarberId: string,
  startTimeIso: string,
  now: Date = new Date(),
): Promise<RescheduleResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new BookingError("INVALID_TOKEN", "Cancel token is required", 400);
  }
  try {
    const existing = await getStore().getAppointmentByCancelToken(trimmed);
    if (!existing) throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    const { start, end } = await validateRescheduleTarget(
      existing,
      newBarberId,
      startTimeIso,
      now,
      { requireLead: true, requireRescheduleQuota: true },
    );
    return await getStore().rescheduleAppointmentByToken(
      trimmed,
      newBarberId,
      start,
      end,
    );
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

/** Shop board reschedule — no lead / no count limit; does not consume customer quota. */
export async function staffRescheduleBooking(
  appointmentId: string,
  newBarberId: string,
  startTimeIso: string,
  now: Date = new Date(),
): Promise<RescheduleResult> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  try {
    const existing = await getStore().getAppointment(appointmentId);
    if (!existing) throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    const { start, end } = await validateRescheduleTarget(
      existing,
      newBarberId,
      startTimeIso,
      now,
      { requireLead: false, requireRescheduleQuota: false, staffMode: true },
    );
    return await getStore().staffRescheduleAppointment(
      appointmentId,
      newBarberId,
      start,
      end,
    );
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export { canCustomerReschedule } from "@/lib/services/slot-service";

export async function markLateCalled(appointmentId: string): Promise<Appointment> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  try {
    return await getStore().markLateCalled(appointmentId);
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function markAppointmentOutcome(
  appointmentId: string,
  outcome: "completed" | "no_show" | "left",
  options?: { serviceId?: string | null; priceBaht?: number | null },
): Promise<Appointment> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  if (outcome !== "completed" && outcome !== "no_show" && outcome !== "left") {
    throw new BookingError("INVALID_OUTCOME", "Invalid outcome", 400);
  }
  if (options?.priceBaht != null && (!Number.isFinite(options.priceBaht) || options.priceBaht < 0)) {
    throw new BookingError("INVALID_PRICE", "Invalid price", 400);
  }
  try {
    const existing = await getStore().getAppointment(appointmentId);
    if (!existing) throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    if (outcome === "no_show" && existing.source === "walk_in") {
      throw new BookingError("INVALID_OUTCOME", "Walk-in cannot be marked no-show", 400);
    }
    return await getStore().markAppointmentOutcome(appointmentId, outcome, options);
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function getAdminDay(
  dateISO: string,
  shopId: string,
  staff: StaffAuth,
  now: Date = new Date(),
  includeClosedQueue = false,
): Promise<AdminColumn[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
  }

  try {
    const store = getStore();
    const allBarbers = await listBarbers(shopId);
    const barbers =
      isShopOperatorRole(staff.role)
        ? allBarbers
        : allBarbers.filter((b) => b.id === staff.barberId);
    const settings = await store.getShopSettings(shopId);
    const shopHours = normalizeShopHours(settings.hours);
    const range = dayRangeUtc(dateISO);
    const barberIds = new Set(barbers.map((b) => b.id));
    const [allBooked, allBlocked, allBreaks, history] = await Promise.all([
      store.listDayAppointments(range.from, range.to),
      store.listDayBlocks(range.from, range.to),
      Promise.all(barbers.map((barber) => store.listRecurringBreaks(barber.id))),
      store.listAppointmentsInRange(new Date(0), range.to),
    ]);
    const shopNoShows = history.filter(
      (row) => barberIds.has(row.barber_id) && row.status === "no_show",
    );
    const booked = allBooked.filter((row) => barberIds.has(row.barber_id));
    const bookedBarberIds = new Set(booked.map((row) => row.barber_id));
    const visibleBarbers = selectAdminBoardBarbers(
      barbers,
      bookedBarberIds,
      includeClosedQueue,
    );
    const visibleIds = new Set(visibleBarbers.map((b) => b.id));
    const blocked = allBlocked.filter((row) => visibleIds.has(row.barber_id));
    const breaksByBarber = new Map(
      visibleBarbers.map((barber) => {
        const index = barbers.findIndex((item) => item.id === barber.id);
        return [barber.id, allBreaks[index] ?? []];
      }),
    );

    return visibleBarbers.map((barber) => {
      const barberBooked = booked.filter((row) => row.barber_id === barber.id);
      const barberBlocked = blocked.filter((row) => row.barber_id === barber.id);
      const recurringBreaks = breaksByBarber.get(barber.id) ?? [];
      const breakRanges = recurringBreaksForDate(dateISO, recurringBreaks);
      const busy = [
        ...barberBooked.map((row) => ({ start_time: row.start_time, end_time: row.end_time })),
        ...barberBlocked.map((row) => ({ start_time: row.start_time, end_time: row.end_time })),
      ];

      const slots: AdminSlot[] = generateSlots({
        dateISO,
        barber,
        busy,
        recurringBreaks,
        shopHours,
        now,
      }).map((slot) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const block = barberBlocked.find((row) =>
          intervalsOverlap(slotStart, slotEnd, new Date(row.start_time), new Date(row.end_time)),
        );
        if (block) {
          return { ...slot, kind: "blocked", blockId: block.id, reason: block.reason };
        }
        const appointment = barberBooked.find((row) =>
          intervalsOverlap(slotStart, slotEnd, new Date(row.start_time), new Date(row.end_time)),
        );
        if (appointment) {
          const noShowCount = countCustomerNoShows(shopNoShows, {
            customerLineId: appointment.customer_line_id,
            customerPhone: appointment.customer_phone,
          });
          return {
            ...slot,
            kind: "booked",
            customerName: appointment.customer_name,
            customerPhone: appointment.customer_phone,
            customerLineId: appointment.customer_line_id ?? null,
            appointmentId: appointment.id,
            appointmentStart: appointment.start_time,
            appointmentEnd: appointment.end_time,
            status: appointment.status,
            source: appointment.source ?? "line",
            viaQr: Boolean(appointment.via_qr),
            isLate: appointment.status === "confirmed" && isLate(appointment.start_time, now),
            lateCalledAt: appointment.late_called_at ?? null,
            noShowCount,
          };
        }
        const onBreak = breakRanges.some((item) =>
          intervalsOverlap(slotStart, slotEnd, item.start, item.end),
        );
        if (onBreak) {
          return { ...slot, kind: "blocked", reason: "break", available: false };
        }
        return { ...slot, kind: "free" };
      });

      return { barber, slots };
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}
