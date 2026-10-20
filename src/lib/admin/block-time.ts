import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  dateISOFromInstant,
  formatSlotTime,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn, AdminSlot } from "@/types/booking";

/** Staff-chosen block reasons (not system `break`, which stays locked). */
export type BlockReasonCode = "rest" | "errand" | "other";

export type BlockQuickKind = "30m" | "1h" | "noon" | "restOfDay";

export const BLOCK_REASON_CODES: BlockReasonCode[] = ["rest", "errand", "other"];

export function isStaffBlockReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  if (reason === "break") return false;
  return true;
}

/** Board label: ปิดเวลา · พัก (never raw English `manual`). */
export function blockedSlotLabel(
  reason: string | null | undefined,
  translate: (key: string) => string,
): string {
  const closed = translate("admin.blockClosed");
  if (!reason || reason === "manual" || reason === "walk-in") return closed;
  if (reason === "break") return translate("admin.break");
  if (reason === "rest") return `${closed} · ${translate("admin.blockReason.rest")}`;
  if (reason === "errand") return `${closed} · ${translate("admin.blockReason.errand")}`;
  if (reason === "other") return `${closed} · ${translate("admin.blockReason.other")}`;
  // Legacy free-text reasons
  return `${closed} · ${reason}`;
}

export function blockConfirmSummary(
  template: string,
  barberName: string,
  startISO: string,
  endISO: string,
): string {
  return template
    .replace("{name}", barberName)
    .replace("{start}", formatSlotTime(startISO))
    .replace("{end}", formatSlotTime(endISO));
}

/** Next free grid cell start at or after `now` (default block start). */
export function nextBlockStartISO(
  column: AdminColumn,
  now: Date = new Date(),
): string | null {
  const nowMs = now.getTime();
  const slots = column.slots ?? [];
  // Prefer the free cell covering now (block from current slot), else next future free.
  const covering = slots.find((s) => {
    if (s.kind !== "free") return false;
    const start = new Date(s.startTime).getTime();
    const end = new Date(s.endTime).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start <= nowMs && nowMs < end;
  });
  if (covering) return covering.startTime;
  const next = slots.find((s) => {
    if (s.kind !== "free") return false;
    const start = new Date(s.startTime).getTime();
    return Number.isFinite(start) && start >= nowMs;
  });
  return next?.startTime ?? null;
}

export function shopCloseISOForDay(
  shopHours: ShopHours,
  dateISO: string,
): string | null {
  const day = resolveShopHoursForDate(shopHours, dateISO);
  if (!day?.close) return null;
  return fromZonedTime(`${dateISO}T${day.close}:00`, SHOP_TIMEZONE).toISOString();
}

export function noonISOForDay(dateISO: string): string {
  return fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE).toISOString();
}

export function quickBlockEndISO(
  startISO: string,
  kind: BlockQuickKind,
  opts: { shopHours: ShopHours; freeUntilISO?: string | null },
): string | null {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return null;
  const dateISO = dateISOFromInstant(start);

  if (kind === "30m") {
    return new Date(start.getTime() + 30 * 60_000).toISOString();
  }
  if (kind === "1h") {
    return new Date(start.getTime() + 60 * 60_000).toISOString();
  }
  if (kind === "noon") {
    const noon = new Date(noonISOForDay(dateISO));
    if (noon.getTime() <= start.getTime()) return null;
    return noon.toISOString();
  }
  // rest of day: shop close, capped by freeUntil when provided
  const close = shopCloseISOForDay(opts.shopHours, dateISO);
  let endMs = close ? new Date(close).getTime() : NaN;
  if (opts.freeUntilISO) {
    const freeMs = new Date(opts.freeUntilISO).getTime();
    if (Number.isFinite(freeMs)) {
      endMs = Number.isFinite(endMs) ? Math.max(endMs, freeMs) : freeMs;
      // Prefer the later of shop close vs free stretch? User asked "ทั้งวันที่เหลือ"
      // = remaining day → shop close. freeUntil may be earlier if next booking.
      // Use shop close when available; else freeUntil.
      endMs = close ? new Date(close).getTime() : freeMs;
    }
  }
  if (!Number.isFinite(endMs) || endMs <= start.getTime()) return null;
  return new Date(endMs).toISOString();
}

/** Distinct start/end HH:mm options from the barber's day grid. */
export function blockTimeOptions(column: AdminColumn): string[] {
  const set = new Set<string>();
  for (const s of column.slots ?? []) {
    set.add(formatSlotTime(s.startTime));
    set.add(formatSlotTime(s.endTime));
  }
  return [...set].sort();
}

export function combineDateAndHm(dateISO: string, hm: string): string {
  return fromZonedTime(`${dateISO}T${hm}:00`, SHOP_TIMEZONE).toISOString();
}

export function overlappingBookings(
  column: AdminColumn,
  startISO: string,
  endISO: string,
): AdminSlot[] {
  const startMs = new Date(startISO).getTime();
  const endMs = new Date(endISO).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];
  return (column.slots ?? []).filter((s) => {
    if (s.kind !== "booked") return false;
    if (s.status === "completed" || s.status === "no_show" || s.status === "left") return false;
    const a = new Date(s.appointmentStart ?? s.startTime).getTime();
    const b = new Date(s.appointmentEnd ?? s.endTime).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return a < endMs && b > startMs;
  });
}

/** Full range for a TimeBlock painted across many cells (same blockId). */
export function blockRangeFromColumn(
  column: AdminColumn,
  blockId: string,
): { startTime: string; endTime: string } | null {
  const cells = (column.slots ?? []).filter(
    (s) => s.kind === "blocked" && s.blockId === blockId,
  );
  if (cells.length === 0) return null;
  let start = cells[0].startTime;
  let end = cells[0].endTime;
  for (const c of cells) {
    if (c.startTime < start) start = c.startTime;
    if (c.endTime > end) end = c.endTime;
  }
  return { startTime: start, endTime: end };
}

export function hmFromISO(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "HH:mm");
}
