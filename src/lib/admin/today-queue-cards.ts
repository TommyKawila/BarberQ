import { getBarberFreeNow } from "@/lib/admin/free-barbers";
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
  /** Next upcoming confirmed booking (distinct appointment) */
  next: AdminSlot | null;
}

function safeSlots(column: AdminColumn): AdminSlot[] {
  return Array.isArray(column.slots) ? column.slots : [];
}

function bounds(slot: AdminSlot): { start: number; end: number } {
  const startIso = slot.appointmentStart ?? slot.startTime;
  const endIso = slot.appointmentEnd ?? slot.endTime;
  return { start: new Date(startIso).getTime(), end: new Date(endIso).getTime() };
}

function isActiveBooked(slot: AdminSlot, nowMs: number): boolean {
  if (slot.kind !== "booked") return false;
  if (slot.status === "completed" || slot.status === "no_show" || slot.status === "left") {
    return false;
  }
  const { start, end } = bounds(slot);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= nowMs && nowMs < end;
}

/** Next distinct appointment after `afterMs`, skipping the active appointment id. */
export function nextUpcoming(
  column: AdminColumn,
  afterMs: number,
  excludeAppointmentId?: string | null,
): AdminSlot | null {
  const seen = new Set<string>();
  const upcoming = safeSlots(column)
    .filter((s) => {
      if (s.kind !== "booked") return false;
      if (s.status === "completed" || s.status === "no_show" || s.status === "left") return false;
      if (excludeAppointmentId && s.appointmentId === excludeAppointmentId) return false;
      if (s.appointmentId) {
        if (seen.has(s.appointmentId)) return false;
        seen.add(s.appointmentId);
      }
      const { start } = bounds(s);
      return Number.isFinite(start) && start >= afterMs;
    })
    .sort((a, b) => bounds(a).start - bounds(b).start);
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
    // Prefer the grid cell that contains appointment start when several cells overlap one apt
    const activeSlots = slots.filter((s) => isActiveBooked(s, nowMs));
    const current =
      activeSlots.find((s) => {
        const startIso = s.appointmentStart ?? s.startTime;
        return new Date(startIso).getTime() <= nowMs;
      }) ??
      activeSlots[0] ??
      null;

    if (current) {
      const { start, end } = bounds(current);
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
        next: nextUpcoming(column, end, current.appointmentId),
      });
      continue;
    }

    const free = getBarberFreeNow(column, now);
    const next = nextUpcoming(column, nowMs);
    if (free) {
      const untilMs = new Date(free.freeUntil).getTime();
      const freeMinutes = Math.max(0, Math.round((untilMs - nowMs) / 60_000));
      cards.push({
        barberId: column.barber.id,
        barberName: column.barber.name ?? "",
        state: "free",
        current: null,
        progress: 0,
        remainingMinutes: null,
        freeUntil: free.freeUntil,
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

/**
 * Next-row customer label: avoid "Walk-in #1 (Walk-in)" — show source in
 * parentheses only when the name does not already imply it.
 */
export function nextRowCustomerLabel(
  slot: AdminSlot,
  labels: { line: string; walkIn: string; phone: string; chat: string },
): string {
  const name = (slot.customerName ?? "").trim() || "—";
  const src = sourceLabel(slot.source, slot.viaQr, labels);
  if (/^Walk-in #\d+/i.test(name)) return name;
  if (name.toLowerCase() === src.toLowerCase()) return name;
  if (slot.source === "walk_in" && /^walk-in\b/i.test(name)) return name;
  return `${name} (${src})`;
}

/** Display start/end for a booked card (prefer real appointment bounds). */
export function bookedDisplayTimes(slot: AdminSlot): { start: string; end: string } {
  return {
    start: slot.appointmentStart ?? slot.startTime,
    end: slot.appointmentEnd ?? slot.endTime,
  };
}
