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

function isFreeNow(slot: AdminSlot, nowMs: number): boolean {
  if (!slot || slot.kind !== "free" || !slot.available) return false;
  if (!slot.startTime || !slot.endTime) return false;
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs + 5 * 60_000 && end > nowMs;
}

/** Extend free-until through consecutive free slots */
function freeUntilFor(column: AdminColumn, fromSlot: AdminSlot): string {
  let until = fromSlot.endTime;
  const slots = safeSlots(column);
  const startIdx = slots.findIndex((s) => s.startTime === fromSlot.startTime);
  if (startIdx < 0) return until;
  for (let i = startIdx + 1; i < slots.length; i += 1) {
    const next = slots[i];
    if (next.kind !== "free" || !next.available) break;
    if (next.startTime !== until) break;
    until = next.endTime;
  }
  return until;
}

export function listFreeBarbersNow(
  columns: AdminColumn[] | null | undefined,
  now: Date = new Date(),
): FreeBarberNow[] {
  const nowMs = now.getTime();
  const out: FreeBarberNow[] = [];
  for (const column of columns ?? []) {
    if (!column?.barber?.id) continue;
    const slot = safeSlots(column).find((s) => isFreeNow(s, nowMs));
    if (!slot) continue;
    out.push({
      barberId: column.barber.id,
      barberName: column.barber.name ?? "",
      slot,
      freeUntil: freeUntilFor(column, slot),
    });
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
        if (slot.status === "completed" || slot.status === "left" || slot.status === "no_show") {
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
