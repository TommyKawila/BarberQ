import {
  getBarberFreeNow,
  isShopClosedNow,
  nextShopOpenLabel,
} from "@/lib/admin/free-barbers";
import { isBarberOffToday } from "@/lib/admin/today-queue-cards";
import {
  dateISOFromInstant,
  formatSlotTime,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn, AdminSlot } from "@/types/booking";
import { fromZonedTime } from "date-fns-tz";

export type WalkInOffer = {
  barberId: string;
  startTime: string;
};

export type WalkInAssessment =
  | {
      kind: "ok";
      barberId: string;
      barberName: string;
      startTime: string;
      timeLabel: string;
      /** Accepting a prior next-free offer (not "start now"). */
      fromOffer: boolean;
    }
  | {
      kind: "shop_before_open";
      barberId: string;
      barberName: string;
      openLabel: string;
    }
  | {
      kind: "shop_after_close";
      barberId: string;
      barberName: string;
      nextOpenLabel: string | null;
    }
  | {
      kind: "shop_closed_day";
      barberId: string;
      barberName: string;
      nextOpenLabel: string | null;
    }
  | {
      kind: "barber_off";
      barberId: string;
      barberName: string;
    }
  | {
      kind: "busy";
      barberId: string;
      barberName: string;
      nextFreeLabel: string;
      nextFreeStartTime: string;
    }
  | {
      kind: "no_slot";
      barberId: string;
      barberName: string;
    };

function shopOpenInstant(dateISO: string, open: string): Date {
  return fromZonedTime(`${dateISO}T${open}:00`, SHOP_TIMEZONE);
}

function shopCloseInstant(dateISO: string, close: string): Date {
  return fromZonedTime(`${dateISO}T${close}:00`, SHOP_TIMEZONE);
}

/** First free board cell at/after `afterMs` (available free preferred). */
export function findNextFreeBoardSlot(
  column: AdminColumn,
  afterMs: number,
): AdminSlot | null {
  const slots = Array.isArray(column.slots) ? column.slots : [];
  return (
    slots.find(
      (s) =>
        s.kind === "free" &&
        s.available &&
        Number.isFinite(new Date(s.startTime).getTime()) &&
        new Date(s.startTime).getTime() >= afterMs - 5 * 60_000,
    ) ??
    slots.find(
      (s) =>
        s.kind === "free" &&
        s.available &&
        Number.isFinite(new Date(s.startTime).getTime()) &&
        new Date(s.startTime).getTime() >= afterMs,
    ) ??
    null
  );
}

function isActiveBooked(slot: AdminSlot, nowMs: number): boolean {
  if (slot.kind !== "booked") return false;
  if (slot.status === "completed" || slot.status === "no_show" || slot.status === "left") {
    return false;
  }
  const start = new Date(slot.appointmentStart ?? slot.startTime).getTime();
  const end = new Date(slot.appointmentEnd ?? slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs && nowMs < end;
}

function activeBusyEndMs(column: AdminColumn, nowMs: number): number | null {
  let end: number | null = null;
  for (const slot of column.slots ?? []) {
    if (!isActiveBooked(slot, nowMs)) continue;
    const e = new Date(slot.appointmentEnd ?? slot.endTime).getTime();
    if (!Number.isFinite(e)) continue;
    if (end == null || e > end) end = e;
  }
  return end;
}

function offerStillFree(column: AdminColumn, startTime: string): boolean {
  const startMs = new Date(startTime).getTime();
  if (!Number.isFinite(startMs)) return false;
  const slots = Array.isArray(column.slots) ? column.slots : [];
  return slots.some(
    (s) =>
      s.kind === "free" &&
      s.available &&
      s.startTime === startTime,
  );
}

/**
 * Decide whether Walk-in can start now, should wait for open, or offer next free.
 * Never suggests booking "now" while the shop is closed — that created ghost
 * appointments before open that conflicted while the board still showed ว่าง.
 */
export function assessWalkInQuick(
  column: AdminColumn | undefined,
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
  offer: WalkInOffer | null = null,
): WalkInAssessment {
  const barberId = column?.barber.id ?? "";
  const barberName = column?.barber.name ?? "";

  if (!column?.barber?.id) {
    return { kind: "no_slot", barberId, barberName };
  }

  if (isBarberOffToday(column.barber, now)) {
    return { kind: "barber_off", barberId, barberName };
  }

  const dateISO = dateISOFromInstant(now);
  const shopDay = resolveShopHoursForDate(hours, dateISO);

  if (!shopDay) {
    return {
      kind: "shop_closed_day",
      barberId,
      barberName,
      nextOpenLabel: nextShopOpenLabel(hours, now),
    };
  }

  const openAt = shopOpenInstant(dateISO, shopDay.open);
  const closeAt = shopCloseInstant(dateISO, shopDay.close);
  const nowMs = now.getTime();

  if (nowMs < openAt.getTime()) {
    return {
      kind: "shop_before_open",
      barberId,
      barberName,
      openLabel: shopDay.open,
    };
  }

  if (nowMs >= closeAt.getTime() || isShopClosedNow(hours, now)) {
    return {
      kind: "shop_after_close",
      barberId,
      barberName,
      nextOpenLabel: nextShopOpenLabel(hours, now),
    };
  }

  // Honour a prior "busy → next free" offer on the same barber.
  if (
    offer &&
    offer.barberId === barberId &&
    offerStillFree(column, offer.startTime)
  ) {
    return {
      kind: "ok",
      barberId,
      barberName,
      startTime: offer.startTime,
      timeLabel: formatSlotTime(offer.startTime),
      fromOffer: true,
    };
  }

  const busyEnd = activeBusyEndMs(column, nowMs);
  if (busyEnd != null) {
    const next = findNextFreeBoardSlot(column, busyEnd);
    if (next) {
      return {
        kind: "busy",
        barberId,
        barberName,
        nextFreeLabel: formatSlotTime(next.startTime),
        nextFreeStartTime: next.startTime,
      };
    }
    return { kind: "no_slot", barberId, barberName };
  }

  const freeNow = getBarberFreeNow(column, now);
  if (freeNow) {
    // Start now while shop is open — server snaps to 5-min bucket.
    const startTime = now.toISOString();
    return {
      kind: "ok",
      barberId,
      barberName,
      startTime,
      timeLabel: formatSlotTime(startTime),
      fromOffer: false,
    };
  }

  const next = findNextFreeBoardSlot(column, nowMs);
  if (next) {
    return {
      kind: "busy",
      barberId,
      barberName,
      nextFreeLabel: formatSlotTime(next.startTime),
      nextFreeStartTime: next.startTime,
    };
  }

  return { kind: "no_slot", barberId, barberName };
}

/** Short disabled-button reason when Walk-in should not fire. */
export function walkInDisabledReason(
  column: AdminColumn | undefined,
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
): WalkInAssessment | null {
  const result = assessWalkInQuick(column, hours, now, null);
  if (
    result.kind === "shop_before_open" ||
    result.kind === "shop_after_close" ||
    result.kind === "shop_closed_day" ||
    result.kind === "barber_off"
  ) {
    return result;
  }
  return null;
}
