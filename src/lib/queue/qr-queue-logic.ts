/** Pure helpers for P8 QR walk-in queue (ordering + first-available). */

export type QrQueueStatus = "waiting" | "started" | "cancelled" | "left";

export interface QrQueueEntryLike {
  id: string;
  created_at: string;
  status: QrQueueStatus;
  preferred_barber_id?: string | null;
}

/** FIFO: older created_at first; stable by id. */
export function sortWaitingByJoinOrder<T extends QrQueueEntryLike>(entries: T[]): T[] {
  return [...entries]
    .filter((e) => e.status === "waiting")
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
}

/** 1-based position in the waiting line, or null if not waiting. */
export function queuePosition(
  entryId: string,
  waiting: QrQueueEntryLike[],
): number | null {
  const ordered = sortWaitingByJoinOrder(waiting);
  const idx = ordered.findIndex((e) => e.id === entryId);
  return idx < 0 ? null : idx + 1;
}

/** Customers ahead of this entry (position - 1). */
export function aheadCount(position: number | null): number {
  if (position == null || position < 1) return 0;
  return position - 1;
}

export interface FirstAvailableCandidate {
  barberId: string;
  /** ISO free-until when free now; null if busy */
  freeUntil: string | null;
  /** ISO when next free stretch starts; null if unknown/fully booked */
  nextFreeAt: string | null;
}

export type PickFirstAvailableOptions = {
  /**
   * When starting a cut "now", only barbers free right now are valid.
   * Falling back to nextFreeAt would book into an occupied chair.
   */
  freeNowOnly?: boolean;
};

/**
 * Prefer barber free now with the longest free stretch;
 * else (unless freeNowOnly) soonest nextFreeAt. Returns null if none usable.
 */
export function pickFirstAvailableBarber(
  candidates: FirstAvailableCandidate[],
  now: Date = new Date(),
  opts: PickFirstAvailableOptions = {},
): string | null {
  const nowMs = now.getTime();
  const freeNow = candidates
    .filter((c) => c.freeUntil && new Date(c.freeUntil).getTime() > nowMs)
    .sort((a, b) => {
      const aUntil = new Date(a.freeUntil!).getTime();
      const bUntil = new Date(b.freeUntil!).getTime();
      return bUntil - aUntil;
    });
  if (freeNow.length) return freeNow[0].barberId;
  if (opts.freeNowOnly) return null;

  const upcoming = candidates
    .filter((c) => c.nextFreeAt && new Date(c.nextFreeAt).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.nextFreeAt!).getTime() - new Date(b.nextFreeAt!).getTime(),
    );
  return upcoming[0]?.barberId ?? null;
}

/** Ordered free-now barber ids (longest free stretch first). */
export function listFreeNowBarberIds(
  candidates: FirstAvailableCandidate[],
  now: Date = new Date(),
): string[] {
  const nowMs = now.getTime();
  return candidates
    .filter((c) => c.freeUntil && new Date(c.freeUntil).getTime() > nowMs)
    .sort((a, b) => {
      const aUntil = new Date(a.freeUntil!).getTime();
      const bUntil = new Date(b.freeUntil!).getTime();
      return bUntil - aUntil;
    })
    .map((c) => c.barberId);
}

/** Rough wait estimate from ahead count × slot minutes. */
export function estimateWaitMinutes(ahead: number, slotMinutes: number): number {
  const slot = Number.isFinite(slotMinutes) && slotMinutes > 0 ? slotMinutes : 30;
  return Math.max(0, ahead) * slot;
}

/** True when ahead hits exactly 2 (push trigger). */
export function shouldNotifyQueueAhead(ahead: number): boolean {
  return ahead === 2;
}
