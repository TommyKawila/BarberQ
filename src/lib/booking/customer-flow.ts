import { getBangkokWeekday } from "@/lib/services/slot-service";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import type { Barber } from "@/types/booking";

const PHONE_RE = /^0\d{8,9}$/;

export type ShopStaffMe = {
  role: "owner" | "barber";
  barberId: string;
};

export function bookingShopTitle(shopName: string | null | undefined): string | null {
  const trimmed = shopName?.trim();
  return trimmed ? trimmed : null;
}

export function staffIdentityKey(staff: ShopStaffMe | null | undefined): MessageKey {
  if (staff?.role === "owner") return "booking.identityOwner";
  if (staff?.role === "barber") return "booking.identityBarber";
  return "booking.identityCustomer";
}

export function canShowOwnerTools(staff: ShopStaffMe | null | undefined): boolean {
  return Boolean(staff);
}

export function bookingSummaryReady(
  barberId: string | null | undefined,
  dateISO: string | null | undefined,
  selectedStart: string | null | undefined,
): boolean {
  return Boolean(barberId && dateISO && selectedStart);
}

export function defaultBookableBarberId(barbers: Barber[]): string | null {
  if (barbers.length === 1) return barbers[0].id;
  return null;
}

export function isShopClosedOnDate(hours: ShopHours | null | undefined, dateISO: string): boolean {
  const normalized = normalizeShopHours(hours);
  const weekday = getBangkokWeekday(dateISO);
  return normalized[weekday]?.closed ?? false;
}

export function isCustomerDateDisabled(
  dateISO: string,
  hours: ShopHours | null | undefined,
  barberOffDays: number[],
): boolean {
  if (isShopClosedOnDate(hours, dateISO)) return true;
  const weekday = getBangkokWeekday(dateISO);
  return barberOffDays.includes(weekday);
}

export function bookingErrorI18nKey(code: string | undefined): MessageKey {
  switch (code) {
    case "SLOT_TAKEN":
    case "SLOT_BLOCKED":
      return "booking.slotTaken";
    case "INVALID_PHONE":
      return "booking.invalidPhone";
    case "INVALID_NAME":
      return "booking.invalidName";
    case "UNAUTHORIZED":
      return "booking.unauthorized";
    case "SLOT_PAST":
      return "booking.slotPast";
    case "INVALID_SLOT":
      return "booking.invalidSlot";
    default:
      return "booking.failed";
  }
}

export function canSubmitBooking(submitting: boolean): boolean {
  return !submitting;
}

export function normalizeCustomerPhone(value: string): string {
  return value.replace(/[\s-]/g, "").trim();
}

export function isValidCustomerPhone(value: string): boolean {
  return PHONE_RE.test(normalizeCustomerPhone(value));
}

export function maskPhone(phone: string): string {
  const normalized = normalizeCustomerPhone(phone);
  if (normalized.length < 7) return normalized;
  const head = normalized.slice(0, 3);
  const tail = normalized.slice(-3);
  return `${head}-xxx-${tail}`;
}

export function sortAppointmentsUpcomingFirst<T extends { start_time: string }>(
  appointments: T[],
  now = new Date(),
): T[] {
  const nowMs = now.getTime();
  return [...appointments].sort((a, b) => {
    const aFuture = new Date(a.start_time).getTime() >= nowMs;
    const bFuture = new Date(b.start_time).getTime() >= nowMs;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}
