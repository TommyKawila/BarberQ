import { getStore } from "@/lib/data";
import { thaiQrQueueError } from "@/lib/queue/qr-queue-errors";
import {
  aheadCount,
  estimateWaitMinutes,
  listFreeNowBarberIds,
  pickFirstAvailableBarber,
  queuePosition,
  sortWaitingByJoinOrder,
  type FirstAvailableCandidate,
} from "@/lib/queue/qr-queue-logic";
import {
  getQrQueueEntry,
  getWaitingQrQueueForCustomer,
  insertQrQueueEntry,
  listWaitingQrQueue,
  updateQrQueueEntry,
} from "@/lib/queue/qr-queue-store";
import type { JoinQrQueueInput, QrQueueEntry, QrQueuePublicView } from "@/lib/queue/qr-queue-types";
import { notifyQueueAheadForShop } from "@/lib/line/queue-ahead-notify";
import {
  BookingError,
  createStaffBooking,
  findNextConflictEnd,
} from "@/lib/services/booking-service";
import type { StaffAuth } from "@/lib/admin-auth";
import { addMinutes } from "date-fns";
import type { Appointment } from "@/types/booking";

function qrErr(code: string, status: number): BookingError {
  return new BookingError(code, thaiQrQueueError(code), status);
}

async function defaultSlotMinutes(shopId: string): Promise<number> {
  const barbers = await getStore().listBarbersByShop(shopId);
  const active = barbers.filter((b) => b.is_active !== false && b.is_bookable !== false);
  return active[0]?.slot_duration_minutes ?? 30;
}

export async function buildQrQueueView(
  shopId: string,
  entry: QrQueueEntry,
): Promise<QrQueuePublicView> {
  const waiting = await listWaitingQrQueue(shopId);
  const position = queuePosition(entry.id, waiting) ?? 0;
  const ahead = aheadCount(position || null);
  const slot = await defaultSlotMinutes(shopId);
  let preferredBarberName: string | null = null;
  let assignedBarberName: string | null = null;
  if (entry.preferred_barber_id) {
    preferredBarberName =
      (await getStore().getBarber(entry.preferred_barber_id))?.name ?? null;
  }
  if (entry.assigned_barber_id) {
    assignedBarberName =
      (await getStore().getBarber(entry.assigned_barber_id))?.name ?? null;
  }
  return {
    entry,
    position,
    ahead,
    waitMinutes: estimateWaitMinutes(ahead, slot),
    preferredBarberName,
    assignedBarberName,
  };
}

export async function joinQrQueue(input: JoinQrQueueInput): Promise<QrQueuePublicView> {
  const lineId = input.customerLineId.trim();
  if (!lineId) {
    throw qrErr("UNAUTHORIZED", 401);
  }
  if (input.preferredBarberId) {
    const barber = await getStore().getBarber(input.preferredBarberId);
    if (!barber || barber.shop_id !== input.shopId || barber.is_active === false) {
      throw qrErr("INVALID_BARBER", 404);
    }
  }
  try {
    const entry = await insertQrQueueEntry(input);
    const view = await buildQrQueueView(input.shopId, entry);
    void notifyQueueAheadForShop(input.shopId).catch(() => {});
    return view;
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === "ALREADY_WAITING") {
      const existing = await getWaitingQrQueueForCustomer(input.shopId, lineId);
      if (existing) return buildQrQueueView(input.shopId, existing);
      throw qrErr("ALREADY_WAITING", 409);
    }
    throw error;
  }
}

export async function getMyQrQueue(
  shopId: string,
  customerLineId: string,
): Promise<QrQueuePublicView | null> {
  const entry = await getWaitingQrQueueForCustomer(shopId, customerLineId);
  if (!entry) return null;
  return buildQrQueueView(shopId, entry);
}

export async function listShopWaitingQueue(shopId: string): Promise<QrQueuePublicView[]> {
  const waiting = sortWaitingByJoinOrder(await listWaitingQrQueue(shopId));
  return Promise.all(waiting.map((e) => buildQrQueueView(shopId, e)));
}

export async function cancelQrQueueEntry(
  shopId: string,
  entryId: string,
  opts: { byCustomerLineId?: string; asStaff?: boolean },
): Promise<QrQueueEntry> {
  const entry = await getQrQueueEntry(entryId);
  if (!entry || entry.shop_id !== shopId) {
    throw qrErr("NOT_FOUND", 404);
  }
  if (entry.status !== "waiting") {
    throw qrErr("NOT_CANCELLABLE", 409);
  }
  if (opts.byCustomerLineId && entry.customer_line_id !== opts.byCustomerLineId) {
    throw qrErr("FORBIDDEN", 403);
  }
  if (!opts.byCustomerLineId && !opts.asStaff) {
    throw qrErr("FORBIDDEN", 403);
  }
  const updated = await updateQrQueueEntry(entryId, { status: "cancelled" });
  void notifyQueueAheadForShop(shopId).catch(() => {});
  return updated;
}

export async function markQrQueueLeft(
  shopId: string,
  entryId: string,
): Promise<QrQueueEntry> {
  const entry = await getQrQueueEntry(entryId);
  if (!entry || entry.shop_id !== shopId) {
    throw qrErr("NOT_FOUND", 404);
  }
  if (entry.status !== "waiting") {
    throw qrErr("INVALID_STATUS", 409);
  }
  const updated = await updateQrQueueEntry(entryId, { status: "left" });
  void notifyQueueAheadForShop(shopId).catch(() => {});
  return updated;
}

/**
 * Free-now for "เริ่มตัด" must ignore slot.available (mid-slot past starts are
 * unavailable for online booking but the chair can still take a walk-in now).
 * Use busy intervals across the whole shop — not staff-scoped board columns.
 */
async function buildFirstAvailableCandidates(
  shopId: string,
  _staff: StaffAuth,
  now: Date,
): Promise<FirstAvailableCandidate[]> {
  const store = getStore();
  const barbers = (await store.listBarbersByShop(shopId)).filter(
    (b) => b.is_active !== false && b.is_bookable !== false,
  );
  const nowMs = now.getTime();
  const horizon = addMinutes(now, 8 * 60);
  const candidates: FirstAvailableCandidate[] = [];

  for (const barber of barbers) {
    const busy = await store.getBusyIntervals(barber.id, now, horizon);
    let currentBusyEnd: Date | null = null;
    let nextBusyStart: Date | null = null;
    for (const row of busy) {
      const start = new Date(row.start_time);
      const end = new Date(row.end_time);
      if (start.getTime() < nowMs + 60_000 && end.getTime() > nowMs) {
        if (!currentBusyEnd || end > currentBusyEnd) currentBusyEnd = end;
      } else if (start.getTime() > nowMs) {
        if (!nextBusyStart || start < nextBusyStart) nextBusyStart = start;
      }
    }

    if (currentBusyEnd) {
      candidates.push({
        barberId: barber.id,
        freeUntil: null,
        nextFreeAt: currentBusyEnd.toISOString(),
      });
      continue;
    }

    candidates.push({
      barberId: barber.id,
      freeUntil: (nextBusyStart ?? horizon).toISOString(),
      nextFreeAt: null,
    });
  }
  return candidates;
}

export async function resolveQrQueueBarberId(
  shopId: string,
  entry: QrQueueEntry,
  staff: StaffAuth,
  now: Date = new Date(),
): Promise<string> {
  if (entry.preferred_barber_id) {
    const barber = await getStore().getBarber(entry.preferred_barber_id);
    if (!barber || barber.shop_id !== shopId || barber.is_active === false) {
      throw qrErr("INVALID_BARBER", 409);
    }
    return barber.id;
  }
  const candidates = await buildFirstAvailableCandidates(shopId, staff, now);
  // Starting a cut is always "now" — never assign a busy chair via nextFreeAt.
  const picked = pickFirstAvailableBarber(candidates, now, { freeNowOnly: true });
  if (!picked) {
    throw qrErr("NO_BARBER_FREE", 409);
  }
  return picked;
}

export interface StartQrQueueResult {
  entry: QrQueueEntry;
  appointment: Appointment;
  canShortenUntil?: string;
}

type SlotTakenError = BookingError & { canShortenUntil?: string };

function asSlotTakenShorten(message: string, until: string): SlotTakenError {
  const err = new BookingError("SLOT_TAKEN", thaiQrQueueError("SLOT_TAKEN"), 409) as SlotTakenError;
  err.canShortenUntil = until;
  return err;
}

async function tryCreateWalkIn(
  shopId: string,
  barberId: string,
  entry: QrQueueEntry,
  now: Date,
  endTime?: string,
): Promise<Appointment> {
  return createStaffBooking(
    shopId,
    {
      barberId,
      startTime: now.toISOString(),
      source: "walk_in",
      customerName: entry.customer_name,
      customerLineId: entry.customer_line_id,
      viaQr: true,
      endTime,
    },
    now,
  );
}

async function maybeShortenOffer(
  barberId: string,
  now: Date,
  slotMinutes: number,
): Promise<string | null> {
  const proposedEnd = addMinutes(now, slotMinutes);
  const conflictStart = await findNextConflictEnd(barberId, now, proposedEnd);
  if (conflictStart && conflictStart.getTime() - now.getTime() >= 5 * 60_000) {
    return conflictStart.toISOString();
  }
  return null;
}

export async function startQrQueueEntry(
  shopId: string,
  entryId: string,
  staff: StaffAuth,
  opts: { endTime?: string; allowShorten?: boolean; now?: Date } = {},
): Promise<StartQrQueueResult> {
  const now = opts.now ?? new Date();
  const entry = await getQrQueueEntry(entryId);
  if (!entry || entry.shop_id !== shopId) {
    throw qrErr("NOT_FOUND", 404);
  }
  if (entry.status !== "waiting") {
    throw qrErr("INVALID_STATUS", 409);
  }

  const firstAvailable = !entry.preferred_barber_id;
  const candidates = firstAvailable
    ? await buildFirstAvailableCandidates(shopId, staff, now)
    : null;
  const freeNowIds = candidates ? listFreeNowBarberIds(candidates, now) : [];

  const barberIdsToTry: string[] = firstAvailable
    ? freeNowIds
    : [await resolveQrQueueBarberId(shopId, entry, staff, now)];

  if (barberIdsToTry.length === 0) {
    throw qrErr("NO_BARBER_FREE", 409);
  }

  let lastSlotTaken: BookingError | null = null;

  for (const barberId of barberIdsToTry) {
    const barber = await getStore().getBarber(barberId);
    if (!barber || barber.shop_id !== shopId || barber.is_active === false) {
      continue;
    }

    try {
      const appointment = await tryCreateWalkIn(
        shopId,
        barberId,
        entry,
        now,
        opts.endTime,
      );
      const updated = await updateQrQueueEntry(entryId, {
        status: "started",
        appointment_id: appointment.id,
        assigned_barber_id: barberId,
      });
      void notifyQueueAheadForShop(shopId).catch(() => {});
      return { entry: updated, appointment };
    } catch (error) {
      if (!(error instanceof BookingError) || error.code !== "SLOT_TAKEN") {
        throw error;
      }
      lastSlotTaken = error;

      // Preferred barber (or only remaining): offer shorten when possible.
      if (
        !firstAvailable &&
        opts.allowShorten !== false &&
        !opts.endTime
      ) {
        const until = await maybeShortenOffer(
          barberId,
          now,
          barber.slot_duration_minutes,
        );
        if (until) throw asSlotTakenShorten(error.message, until);
      }

      // First-available: try the next free barber instead of failing on a race.
      if (firstAvailable) continue;

      throw qrErr("SLOT_TAKEN", 409);
    }
  }

  // All free-now barbers failed (race) — optional shorten on the longest-free one.
  if (
    firstAvailable &&
    lastSlotTaken &&
    opts.allowShorten !== false &&
    !opts.endTime &&
    freeNowIds[0]
  ) {
    const barber = await getStore().getBarber(freeNowIds[0]);
    if (barber) {
      const until = await maybeShortenOffer(
        freeNowIds[0],
        now,
        barber.slot_duration_minutes,
      );
      if (until) throw asSlotTakenShorten(lastSlotTaken.message, until);
    }
  }

  throw qrErr("NO_BARBER_FREE", 409);
}
