import type { Slot } from "@/types/booking";

export interface PartitionedSlots {
  past: Slot[];
  future: Slot[];
}

/** Split slots into past (startTime <= now) vs future. Order preserved. */
export function partitionPastFutureSlots(
  slots: Slot[],
  now: Date = new Date(),
): PartitionedSlots {
  const nowMs = now.getTime();
  const past: Slot[] = [];
  const future: Slot[] = [];
  for (const slot of slots) {
    if (new Date(slot.startTime).getTime() <= nowMs) {
      past.push(slot);
    } else {
      future.push(slot);
    }
  }
  return { past, future };
}

export interface SlotAvailabilitySummary {
  availableCount: number;
  earliestStartTime: string;
}

/** Summary for available future slots (assumes future list is time-ordered). */
export function summarizeAvailableSlots(
  futureSlots: Slot[],
): SlotAvailabilitySummary | null {
  const available = futureSlots.filter((slot) => slot.available);
  if (available.length === 0) return null;
  return {
    availableCount: available.length,
    earliestStartTime: available[0]!.startTime,
  };
}

/** First available future slot startTime, or null. */
export function firstAvailableStartTime(futureSlots: Slot[]): string | null {
  const hit = futureSlots.find((slot) => slot.available);
  return hit?.startTime ?? null;
}
