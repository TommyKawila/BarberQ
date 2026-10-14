import type { Appointment } from "@/types/booking";

export const NO_SHOW_WARNING_THRESHOLD = 2;

/** Count no-shows matching customer by LINE id or phone (either key). */
export function countCustomerNoShows(
  noShows: Appointment[],
  customer: { customerLineId?: string | null; customerPhone?: string | null },
): number {
  const lineId = customer.customerLineId?.trim() || null;
  const phone = customer.customerPhone?.trim() || null;
  if (!lineId && !phone) return 0;
  let count = 0;
  for (const row of noShows) {
    if (lineId && row.customer_line_id?.trim() === lineId) {
      count += 1;
      continue;
    }
    if (phone && row.customer_phone?.trim() === phone) {
      count += 1;
    }
  }
  return count;
}

export function buildNoShowCountLookup(noShows: Appointment[]): {
  byLineId: Map<string, number>;
  byPhone: Map<string, number>;
} {
  const byLineId = new Map<string, number>();
  const byPhone = new Map<string, number>();
  for (const row of noShows) {
    const lineId = row.customer_line_id?.trim();
    if (lineId) {
      byLineId.set(lineId, (byLineId.get(lineId) ?? 0) + 1);
    }
    const phone = row.customer_phone?.trim();
    if (phone) {
      byPhone.set(phone, (byPhone.get(phone) ?? 0) + 1);
    }
  }
  return { byLineId, byPhone };
}

/**
 * Resolve display count: prefer LINE id when present (avoids double-counting
 * the same history via both keys when both maps include overlapping rows).
 * Falls back to phone-only history when no LINE id.
 */
export function resolveNoShowCount(
  lookup: { byLineId: Map<string, number>; byPhone: Map<string, number> },
  customer: { customerLineId?: string | null; customerPhone?: string | null },
): number {
  const lineId = customer.customerLineId?.trim() || null;
  if (lineId) return lookup.byLineId.get(lineId) ?? 0;
  const phone = customer.customerPhone?.trim() || null;
  if (phone) return lookup.byPhone.get(phone) ?? 0;
  return 0;
}
