import { fromZonedTime } from "date-fns-tz";
import type { RecurringBreak } from "@/lib/data/types";
import {
  dateISOFromInstant,
  getBangkokWeekday,
  recurringBreaksForDate,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { Barber } from "@/types/booking";

/**
 * Same gates as booking-page / generateSlots: active, bookable (queue open),
 * not on off_days, shop open today, now within shop hours, not in a recurring break.
 */
export function isBarberWorkingAt(
  barber: Pick<Barber, "off_days" | "is_active" | "is_bookable">,
  now: Date,
  shopHours: ShopHours | null | undefined,
  recurringBreaks: RecurringBreak[] = [],
): boolean {
  if (barber.is_active === false) return false;
  if (barber.is_bookable === false) return false;

  const dateISO = dateISOFromInstant(now);
  const shopDay = resolveShopHoursForDate(shopHours, dateISO);
  if (!shopDay) return false;

  const weekday = getBangkokWeekday(dateISO);
  if ((barber.off_days ?? []).includes(weekday)) return false;

  const openAt = fromZonedTime(`${dateISO}T${shopDay.open}:00`, SHOP_TIMEZONE);
  const closeAt = fromZonedTime(`${dateISO}T${shopDay.close}:00`, SHOP_TIMEZONE);
  if (now < openAt || now >= closeAt) return false;

  const breaks = recurringBreaksForDate(dateISO, recurringBreaks);
  if (breaks.some((b) => now >= b.start && now < b.end)) return false;

  return true;
}
