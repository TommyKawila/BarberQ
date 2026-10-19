import type { AdminColumn, AdminSlot, AppointmentSource } from "@/types/booking";

export type TodayBarberState = "cutting" | "free" | "idle";

export interface TodayQueueCardModel {
  barberId: string;
  barberName: string;
  state: TodayBarberState;
  /** Active booked slot when cutting */
  current: AdminSlot | null;
  /** Progress 0–1 when cutting */
  progress: number;
  /** Remaining minutes (ceil) when cutting */
  remainingMinutes: number | null;
  /** Free-until ISO when free */
  freeUntil: string | null;
  /** Walk-in window minutes when free */
  freeMinutes: number | null;
  /** Next upcoming confirmed booking */
  next: AdminSlot | null;
}

function safeSlots(column: AdminColumn): AdminSlot[] {
  return Array.isArray(column.slots) ? column.slots : [];
}

function isActiveBooked(slot: AdminSlot, nowMs: number): boolean {
  if (slot.kind !== "booked") return false;
  if (slot.status === "completed" || slot.status === "no_show" || slot.status === "left") {
    return false;
  }
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs && nowMs < end;
}

function isFreeNow(slot: AdminSlot, nowMs: number): boolean {
  if (slot.kind !== "free" || !slot.available) return false;
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs + 5 * 60_000 && end > nowMs;
}

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

function nextUpcoming(column: AdminColumn, afterMs: number): AdminSlot | null {
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

/** Derive per-barber Now cards for Today คิว tab (real board data only). */
export function deriveTodayQueueCards(
  columns: AdminColumn[] | null | undefined,
  now: Date = new Date(),
): TodayQueueCardModel[] {
  const nowMs = now.getTime();
  const cards: TodayQueueCardModel[] = [];

  for (const column of columns ?? []) {
    if (!column?.barber?.id) continue;
    const slots = safeSlots(column);
    const current = slots.find((s) => isActiveBooked(s, nowMs)) ?? null;
    const freeSlot = !current ? slots.find((s) => isFreeNow(s, nowMs)) ?? null : null;

    if (current) {
      const start = new Date(current.startTime).getTime();
      const end = new Date(current.endTime).getTime();
      const span = Math.max(end - start, 1);
      const progress = Math.min(1, Math.max(0, (nowMs - start) / span));
      const remainingMinutes = Math.max(0, Math.ceil((end - nowMs) / 60_000));
      cards.push({
        barberId: column.barber.id,
        barberName: column.barber.name ?? "",
        state: "cutting",
        current,
        progress,
        remainingMinutes,
        freeUntil: null,
        freeMinutes: null,
        next: nextUpcoming(column, end),
      });
      continue;
    }

    const next = nextUpcoming(column, nowMs);
    // Free now: live free slot, OR gap before next booking (past free cells are often unavailable)
    let until: string | null = null;
    if (freeSlot) {
      until = freeUntilFor(column, freeSlot);
    } else if (next) {
      until = next.startTime;
    } else {
      const futureFree = slots.find(
        (s) =>
          s.kind === "free" &&
          s.available &&
          Number.isFinite(new Date(s.endTime).getTime()) &&
          new Date(s.endTime).getTime() > nowMs,
      );
      if (futureFree) until = freeUntilFor(column, futureFree);
    }

    if (until && new Date(until).getTime() > nowMs) {
      const untilMs = new Date(until).getTime();
      const freeMinutes = Math.max(0, Math.round((untilMs - nowMs) / 60_000));
      cards.push({
        barberId: column.barber.id,
        barberName: column.barber.name ?? "",
        state: "free",
        current: null,
        progress: 0,
        remainingMinutes: null,
        freeUntil: until,
        freeMinutes,
        next,
      });
      continue;
    }

    cards.push({
      barberId: column.barber.id,
      barberName: column.barber.name ?? "",
      state: "idle",
      current: null,
      progress: 0,
      remainingMinutes: null,
      freeUntil: null,
      freeMinutes: null,
      next,
    });
  }

  // Cutting first, then free, then idle
  const rank = { cutting: 0, free: 1, idle: 2 } as const;
  return cards.sort((a, b) => rank[a.state] - rank[b.state] || a.barberName.localeCompare(b.barberName));
}

export function sourceLabel(
  source: AppointmentSource | undefined,
  viaQr: boolean | undefined,
  labels: { line: string; walkIn: string; phone: string; chat: string },
): string {
  if (source === "walk_in") return viaQr ? `${labels.walkIn} · QR` : labels.walkIn;
  if (source === "phone") return labels.phone;
  if (source === "chat") return labels.chat;
  return labels.line;
}
