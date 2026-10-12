import type { Slot } from "@/types/booking";

/** Cache / race key for a barber + date pair. */
export function slotAvailabilityKey(barberId: string, dateISO: string): string {
  return `${barberId}|${dateISO}`;
}

/** Only apply a fetch result when it still matches the UI selection. */
export function shouldApplySlotResponse(
  responseKey: string,
  currentKey: string | null | undefined,
): boolean {
  return Boolean(currentKey) && responseKey === currentKey;
}

/**
 * Slots shown in the grid. Never returns another barber/date's slots.
 * Prefer in-state slots when ownership matches; else cached for the desired key;
 * else empty (caller shows skeleton when loading).
 */
export function slotsForDisplay(input: {
  desiredKey: string | null;
  ownerKey: string | null;
  slots: Slot[];
  cache: ReadonlyMap<string, Slot[]>;
}): Slot[] {
  const { desiredKey, ownerKey, slots, cache } = input;
  if (!desiredKey) return [];
  if (ownerKey === desiredKey) return slots;
  return cache.get(desiredKey) ?? [];
}

/** True when the grid should show a loading/skeleton state (no trusted data yet). */
export function slotsDisplayLoading(input: {
  desiredKey: string | null;
  ownerKey: string | null;
  slotsLoading: boolean;
  cache: ReadonlyMap<string, Slot[]>;
}): boolean {
  const { desiredKey, ownerKey, slotsLoading, cache } = input;
  if (!desiredKey) return false;
  if (ownerKey === desiredKey) return slotsLoading;
  return !cache.has(desiredKey);
}

/** Keep selection only if that start is still an available slot. */
export function reconcileSelectedStart(
  selectedStart: string | null,
  slots: Slot[],
): string | null {
  if (!selectedStart) return null;
  const match = slots.find((slot) => slot.startTime === selectedStart && slot.available);
  return match ? selectedStart : null;
}

export function mergeSlotsCache(
  cache: Map<string, Slot[]>,
  dateISO: string,
  slotsByBarberId: Record<string, Slot[]>,
): void {
  for (const [barberId, slots] of Object.entries(slotsByBarberId)) {
    cache.set(slotAvailabilityKey(barberId, dateISO), slots);
  }
}
