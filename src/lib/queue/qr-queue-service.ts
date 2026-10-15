import { listFreeBarbersNow } from "@/lib/admin/free-barbers";
import { getStore } from "@/lib/data";
import {
  aheadCount,
  estimateWaitMinutes,
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
  getAdminDay,
} from "@/lib/services/booking-service";
import type { StaffAuth } from "@/lib/admin-auth";
import { addMinutes } from "date-fns";
import type { Appointment } from "@/types/booking";

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
    throw new BookingError("UNAUTHORIZED", "LINE login required", 401);
  }
  if (input.preferredBarberId) {
    const barber = await getStore().getBarber(input.preferredBarberId);
    if (!barber || barber.shop_id !== input.shopId || barber.is_active === false) {
      throw new BookingError("INVALID_BARBER", "Barber not found", 404);
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
      throw new BookingError("ALREADY_WAITING", "Already in queue", 409);
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
    throw new BookingError("NOT_FOUND", "Queue entry not found", 404);
  }
  if (entry.status !== "waiting") {
    throw new BookingError("NOT_CANCELLABLE", "Queue entry is not waiting", 409);
  }
  if (opts.byCustomerLineId && entry.customer_line_id !== opts.byCustomerLineId) {
    throw new BookingError("FORBIDDEN", "Not your queue entry", 403);
  }
  if (!opts.byCustomerLineId && !opts.asStaff) {
    throw new BookingError("FORBIDDEN", "Not allowed", 403);
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
    throw new BookingError("NOT_FOUND", "Queue entry not found", 404);
  }
  if (entry.status !== "waiting") {
    throw new BookingError("INVALID_STATUS", "Queue entry is not waiting", 409);
  }
  const updated = await updateQrQueueEntry(entryId, { status: "left" });
  void notifyQueueAheadForShop(shopId).catch(() => {});
  return updated;
}

async function buildFirstAvailableCandidates(
  shopId: string,
  staff: StaffAuth,
  now: Date,
): Promise<FirstAvailableCandidate[]> {
  const { dateISOFromInstant } = await import("@/lib/services/slot-service");
  const dateISO = dateISOFromInstant(now);
  const columns = await getAdminDay(dateISO, shopId, staff, now, true);
  const freeNow = listFreeBarbersNow(columns, now);
  const freeIds = new Set(freeNow.map((f) => f.barberId));
  const candidates: FirstAvailableCandidate[] = freeNow.map((f) => ({
    barberId: f.barberId,
    freeUntil: f.freeUntil,
    nextFreeAt: null,
  }));

  for (const column of columns) {
    if (freeIds.has(column.barber.id)) continue;
    if (column.barber.is_active === false) continue;
    const nextFree = column.slots.find(
      (s) =>
        s.kind === "free" &&
        s.available &&
        new Date(s.startTime).getTime() >= now.getTime() - 5 * 60_000,
    );
    candidates.push({
      barberId: column.barber.id,
      freeUntil: null,
      nextFreeAt: nextFree?.startTime ?? null,
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
      throw new BookingError("INVALID_BARBER", "Preferred barber unavailable", 409);
    }
    return barber.id;
  }
  const candidates = await buildFirstAvailableCandidates(shopId, staff, now);
  const picked = pickFirstAvailableBarber(candidates, now);
  if (!picked) {
    throw new BookingError("NO_BARBER_FREE", "No barber available right now", 409);
  }
  return picked;
}

export interface StartQrQueueResult {
  entry: QrQueueEntry;
  appointment: Appointment;
  canShortenUntil?: string;
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
    throw new BookingError("NOT_FOUND", "Queue entry not found", 404);
  }
  if (entry.status !== "waiting") {
    throw new BookingError("INVALID_STATUS", "Queue entry is not waiting", 409);
  }

  const barberId = await resolveQrQueueBarberId(shopId, entry, staff, now);
  const barber = await getStore().getBarber(barberId);
  if (!barber) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }

  try {
    const appointment = await createStaffBooking(shopId, {
      barberId,
      startTime: now.toISOString(),
      source: "walk_in",
      customerName: entry.customer_name,
      customerLineId: entry.customer_line_id,
      viaQr: true,
      endTime: opts.endTime,
    }, now);

    const updated = await updateQrQueueEntry(entryId, {
      status: "started",
      appointment_id: appointment.id,
      assigned_barber_id: barberId,
    });
    void notifyQueueAheadForShop(shopId).catch(() => {});
    return { entry: updated, appointment };
  } catch (error) {
    if (
      error instanceof BookingError &&
      error.code === "SLOT_TAKEN" &&
      opts.allowShorten !== false &&
      !opts.endTime
    ) {
      const proposedEnd = addMinutes(now, barber.slot_duration_minutes);
      const conflictStart = await findNextConflictEnd(barberId, now, proposedEnd);
      if (conflictStart && conflictStart.getTime() - now.getTime() >= 5 * 60_000) {
        const shortenErr = new BookingError("SLOT_TAKEN", error.message, 409);
        (shortenErr as BookingError & { canShortenUntil?: string }).canShortenUntil =
          conflictStart.toISOString();
        throw shortenErr;
      }
    }
    throw error;
  }
}
