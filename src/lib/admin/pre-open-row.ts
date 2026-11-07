import { fromZonedTime } from "date-fns-tz";
import {
  formatSlotTime,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn, AdminSlot } from "@/types/booking";

export interface PreOpenAnalysis {
  from: string;
  to: string;
  openMs: number;
  /** True when every slot before open is `kind === "free"` (safe to collapse). */
  allFree: boolean;
  /** Slots that start before shop open (any column). */
  preOpenSlots: AdminSlot[];
}

function isPreOpenSlot(slot: AdminSlot, openMs: number): boolean {
  const start = new Date(slot.startTime).getTime();
  return Number.isFinite(start) && start < openMs;
}

/**
 * Analyze board slots before shop open.
 * Collapse into a single "ก่อนเปิดร้าน" row only when `allFree` is true —
 * never hide booked/blocked pre-open appointments.
 */
export function analyzePreOpen(
  columns: AdminColumn[] | null | undefined,
  shopHours: ShopHours | null | undefined,
  dateISO: string,
): PreOpenAnalysis | null {
  const day = resolveShopHoursForDate(shopHours, dateISO);
  if (!day) return null;
  const openAt = fromZonedTime(`${dateISO}T${day.open}:00`, SHOP_TIMEZONE);
  const openMs = openAt.getTime();
  const preOpenSlots: AdminSlot[] = [];
  let earliest: number | null = null;

  for (const col of columns ?? []) {
    for (const slot of col.slots ?? []) {
      if (!isPreOpenSlot(slot, openMs)) continue;
      preOpenSlots.push(slot);
      const start = new Date(slot.startTime).getTime();
      if (earliest == null || start < earliest) earliest = start;
    }
  }

  if (earliest == null || preOpenSlots.length === 0) return null;

  const allFree = preOpenSlots.every((s) => s.kind === "free");
  return {
    from: formatSlotTime(new Date(earliest).toISOString()),
    to: day.open,
    openMs,
    allFree,
    preOpenSlots,
  };
}

/** Whether a slot should be hidden under a collapsed all-free pre-open row. */
export function shouldHideUnderPreOpenCollapse(
  slot: AdminSlot,
  preOpen: PreOpenAnalysis | null,
  expanded: boolean,
): boolean {
  if (!preOpen || !preOpen.allFree || expanded) return false;
  return isPreOpenSlot(slot, preOpen.openMs);
}
