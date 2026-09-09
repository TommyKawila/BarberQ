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
  recurringBreaksForDate,
} from "@/lib/services/slot-service";
import { normalizeShopHours } from "@/lib/shop/shop-hours";
import type { StaffAuth } from "@/lib/admin-auth";
import type {
  AdminColumn,
  AdminSlot,
  Appointment,
  Barber,
  CreateBookingInput,
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
      NOT_FOUND: ["Appointment not found", 404],
      INVALID_RANGE: ["Invalid time range", 400],
      INVALID_OUTCOME: ["Cannot mark outcome yet", 400],
      LINE_ID_TAKEN: ["This LINE account is already linked", 409],
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

export async function listBookableBarbers(shopId: string): Promise<Barber[]> {
  const barbers = await listBarbers(shopId);
  return barbers.filter((b) => b.is_bookable !== false);
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
    if (barber.is_bookable === false) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const shopHours = await shopHoursForBarber(barber);
    const range = dayRangeUtc(dateISO);
    const [busy, recurringBreaks] = await Promise.all([
      store.getBusyIntervals(barberId, range.from, range.to),
      store.listRecurringBreaks(barberId),
    ]);
    return generateSlots({ dateISO, barber, busy, recurringBreaks, shopHours, now });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
}

export async function createBooking(input: CreateBookingInput): Promise<Appointment> {
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
    if (barber.is_bookable === false) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const end = addMinutes(start, barber.slot_duration_minutes);
    return await store.createAppointment({
      barberId: input.barberId,
      customerRef,
      customerName: name,
      customerPhone: phone,
      startTime: start,
      endTime: end,
      customerLineId: input.customerLineId,
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw mapStoreError(error);
  }
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
  return createBooking(input);
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
  outcome: "completed" | "no_show",
): Promise<Appointment> {
  if (!isUuid(appointmentId)) {
    throw new BookingError("INVALID_ID", "Invalid appointment id", 400);
  }
  if (outcome !== "completed" && outcome !== "no_show") {
    throw new BookingError("INVALID_OUTCOME", "Invalid outcome", 400);
  }
  try {
    return await getStore().markAppointmentOutcome(appointmentId, outcome);
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
): Promise<AdminColumn[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
  }

  try {
    const store = getStore();
    const allBarbers = await listBarbers(shopId);
    const barbers =
      staff.role === "owner"
        ? allBarbers
        : allBarbers.filter((b) => b.id === staff.barberId);
    const settings = await store.getShopSettings(shopId);
    const shopHours = normalizeShopHours(settings.hours);
    const range = dayRangeUtc(dateISO);
    const barberIds = new Set(barbers.map((b) => b.id));
    const [allBooked, allBlocked, allBreaks] = await Promise.all([
      store.listDayAppointments(range.from, range.to),
      store.listDayBlocks(range.from, range.to),
      Promise.all(barbers.map((barber) => store.listRecurringBreaks(barber.id))),
    ]);
    const booked = allBooked.filter((row) => barberIds.has(row.barber_id));
    const blocked = allBlocked.filter((row) => barberIds.has(row.barber_id));
    const breaksByBarber = new Map(
      barbers.map((barber, index) => [barber.id, allBreaks[index] ?? []]),
    );

    return barbers.map((barber) => {
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
          return {
            ...slot,
            kind: "booked",
            customerName: appointment.customer_name,
            customerPhone: appointment.customer_phone,
            customerLineId: appointment.customer_line_id ?? null,
            appointmentId: appointment.id,
            status: appointment.status,
            isLate: appointment.status === "confirmed" && isLate(appointment.start_time, now),
            lateCalledAt: appointment.late_called_at ?? null,
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
