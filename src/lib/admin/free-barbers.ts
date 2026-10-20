import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  dateISOFromInstant,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn, AdminSlot } from "@/types/booking";

export interface FreeBarberNow {
  barberId: string;
  barberName: string;
  slot: AdminSlot;
  /** ISO end of the free stretch (next busy/block or slot end) */
  freeUntil: string;
}

function safeSlots(column: AdminColumn | null | undefined): AdminSlot[] {
  return Array.isArray(column?.slots) ? column!.slots : [];
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

/** Available free cell covering now (or starting within 5 minutes). */
function isAvailableFreeNow(slot: AdminSlot, nowMs: number): boolean {
  if (!slot || slot.kind !== "free" || !slot.available) return false;
  if (!slot.startTime || !slot.endTime) return false;
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs + 5 * 60_000 && end > nowMs;
}

/**
 * Free cell whose time window covers now — even when `available` is false.
 * Slot generation marks a free cell unavailable once its start has passed
 * (`start <= now`), which is why cards and Walk-in must not rely on `available`.
 */
function coveringFreeSlot(slot: AdminSlot, nowMs: number): boolean {
  if (slot.kind !== "free") return false;
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs && nowMs < end;
}

/** Extend free-until through consecutive free cells (ignore `available`). */
export function freeUntilThrough(column: AdminColumn, fromSlot: AdminSlot): string {
  let until = fromSlot.endTime;
  const slots = safeSlots(column);
  const startIdx = slots.findIndex((s) => s.startTime === fromSlot.startTime);
  if (startIdx < 0) return until;
  for (let i = startIdx + 1; i < slots.length; i += 1) {
    const next = slots[i];
    if (next.kind !== "free") break;
    if (next.startTime !== until) break;
    until = next.endTime;
  }
  return until;
}

function nextUpcomingBooked(column: AdminColumn, afterMs: number): AdminSlot | null {
  const upcoming = safeSlots(column)
    .filter((s) => {
      if (s.kind !== "booked") return false;
      if (s.status === "completed" || s.status === "no_show" || s.status === "left") return false;
      const start = new Date(s.startTime).getTime();
      return Number.isFinite(start) && start >= afterMs;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  return upcoming[0] ?? null;
}

function walkInSlot(nowMs: number, freeUntil: string, hint?: AdminSlot | null): AdminSlot {
  const end = freeUntil;
  if (hint && hint.kind === "free" && hint.available) {
    return { ...hint, endTime: end };
  }
  return {
    startTime: new Date(nowMs).toISOString(),
    endTime: end,
    available: true,
    kind: "free",
  };
}

/**
 * Same free-now rules as Today queue cards: available free cell, OR covering
 * free cell with `available:false` (started), OR gap before next booking /
 * remaining free stretch to close.
 */
export function getBarberFreeNow(
  column: AdminColumn,
  now: Date = new Date(),
): FreeBarberNow | null {
  if (!column?.barber?.id) return null;
  const nowMs = now.getTime();
  const slots = safeSlots(column);
  if (slots.some((s) => isActiveBooked(s, nowMs))) return null;

  const availableNow = slots.find((s) => isAvailableFreeNow(s, nowMs)) ?? null;
  const covering = slots.find((s) => coveringFreeSlot(s, nowMs)) ?? null;
  const next = nextUpcomingBooked(column, nowMs);

  let until: string | null = null;
  let anchor: AdminSlot | null = null;

  if (availableNow) {
    until = freeUntilThrough(column, availableNow);
    anchor = availableNow;
  } else if (covering) {
    until = freeUntilThrough(column, covering);
    anchor = covering;
  } else if (next) {
    until = next.startTime;
    anchor =
      slots.find(
        (s) =>
          s.kind === "free" &&
          s.available &&
          new Date(s.endTime).getTime() <= new Date(next.startTime).getTime() &&
          new Date(s.endTime).getTime() > nowMs,
      ) ?? null;
  } else {
    const futureFree =
      slots.find(
        (s) =>
          s.kind === "free" &&
          s.available &&
          Number.isFinite(new Date(s.endTime).getTime()) &&
          new Date(s.endTime).getTime() > nowMs,
      ) ??
      slots.find(
        (s) =>
          s.kind === "free" &&
          Number.isFinite(new Date(s.endTime).getTime()) &&
          new Date(s.endTime).getTime() > nowMs,
      ) ??
      null;
    if (futureFree) {
      until = freeUntilThrough(column, futureFree);
      anchor = futureFree;
    }
  }

  if (!until || new Date(until).getTime() <= nowMs) return null;

  return {
    barberId: column.barber.id,
    barberName: column.barber.name ?? "",
    slot: walkInSlot(nowMs, until, anchor),
    freeUntil: until,
  };
}

export function listFreeBarbersNow(
  columns: AdminColumn[] | null | undefined,
  now: Date = new Date(),
): FreeBarberNow[] {
  const out: FreeBarberNow[] = [];
  for (const column of columns ?? []) {
    const row = getBarberFreeNow(column, now);
    if (row) out.push(row);
  }
  return out.sort((a, b) => a.freeUntil.localeCompare(b.freeUntil));
}

export interface BoardMiniStats {
  remaining: number;
  done: number;
  freeSlots: number;
}

export function computeBoardMiniStats(
  columns: AdminColumn[] | null | undefined,
  now: Date = new Date(),
): BoardMiniStats {
  const nowMs = now.getTime();
  let remaining = 0;
  let done = 0;
  let freeSlots = 0;
  for (const column of columns ?? []) {
    for (const slot of safeSlots(column)) {
      if (slot.kind === "booked") {
        if (slot.status === "completed") {
          done += 1;
        } else if (slot.status === "confirmed" || !slot.status) {
          remaining += 1;
        }
      } else if (
        slot.kind === "free" &&
        slot.available &&
        slot.endTime &&
        Number.isFinite(new Date(slot.endTime).getTime()) &&
        new Date(slot.endTime).getTime() > nowMs
      ) {
        freeSlots += 1;
      }
    }
  }
  return { remaining, done, freeSlots };
}

export type WhoIsFreeEmptyKind = "closed" | "busy" | "none";

export interface WhoIsFreeEmptyState {
  kind: WhoIsFreeEmptyKind;
  /** HH:mm or weekday + HH:mm for next open */
  nextOpenLabel: string | null;
  /** HH:mm when the next busy barber frees */
  nextFreeLabel: string | null;
}

function shopCloseInstant(dateISO: string, close: string): Date {
  return fromZonedTime(`${dateISO}T${close}:00`, SHOP_TIMEZONE);
}

function shopOpenInstant(dateISO: string, open: string): Date {
  return fromZonedTime(`${dateISO}T${open}:00`, SHOP_TIMEZONE);
}

/** Next opening time label in Asia/Bangkok, looking up to 7 days ahead. */
export function nextShopOpenLabel(
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
): string | null {
  const todayISO = dateISOFromInstant(now);
  for (let i = 0; i < 7; i += 1) {
    const noon = fromZonedTime(`${todayISO}T12:00:00`, SHOP_TIMEZONE);
    const day = addDays(noon, i);
    const dateISO = formatInTimeZone(day, SHOP_TIMEZONE, "yyyy-MM-dd");
    const shopDay = resolveShopHoursForDate(hours, dateISO);
    if (!shopDay) continue;
    const openAt = shopOpenInstant(dateISO, shopDay.open);
    if (openAt.getTime() <= now.getTime()) continue;
    if (i === 0) {
      return formatInTimeZone(openAt, SHOP_TIMEZONE, "HH:mm");
    }
    return formatInTimeZone(openAt, SHOP_TIMEZONE, "EEE HH:mm");
  }
  return null;
}

export function isShopClosedNow(
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
): boolean {
  const dateISO = dateISOFromInstant(now);
  const shopDay = resolveShopHoursForDate(hours, dateISO);
  if (!shopDay) return true;
  const openAt = shopOpenInstant(dateISO, shopDay.open);
  const closeAt = shopCloseInstant(dateISO, shopDay.close);
  return now.getTime() < openAt.getTime() || now.getTime() >= closeAt.getTime();
}

/** Earliest time a currently-busy barber finishes their active cut. */
export function nextBarberFreeLabel(
  columns: AdminColumn[] | null | undefined,
  now: Date = new Date(),
): string | null {
  const nowMs = now.getTime();
  let soonest: number | null = null;
  for (const column of columns ?? []) {
    for (const slot of safeSlots(column)) {
      if (!isActiveBooked(slot, nowMs)) continue;
      const end = new Date(slot.endTime).getTime();
      if (!Number.isFinite(end) || end <= nowMs) continue;
      if (soonest == null || end < soonest) soonest = end;
    }
  }
  if (soonest == null) return null;
  return formatInTimeZone(new Date(soonest), SHOP_TIMEZONE, "HH:mm");
}

export function describeWhoIsFreeEmpty(
  columns: AdminColumn[] | null | undefined,
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
): WhoIsFreeEmptyState {
  if (isShopClosedNow(hours, now)) {
    return {
      kind: "closed",
      nextOpenLabel: nextShopOpenLabel(hours, now),
      nextFreeLabel: null,
    };
  }
  const nextFree = nextBarberFreeLabel(columns, now);
  if (nextFree) {
    return { kind: "busy", nextOpenLabel: null, nextFreeLabel: nextFree };
  }
  return { kind: "none", nextOpenLabel: null, nextFreeLabel: null };
}
