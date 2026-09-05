import { intervalsOverlap } from "@/lib/services/slot-service";
import { BARBER_SEED } from "@/lib/data/seed";
import {
  StoreConflict,
  type BookingStore,
} from "@/lib/data/types";
import type { Appointment, Barber, BusyInterval, TimeBlock } from "@/types/booking";

const GLOBAL_KEY = "__barberq_memory_store__";

interface MemoryState {
  appointments: Appointment[];
  blocks: TimeBlock[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemoryState };

function getState(): MemoryState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { appointments: [], blocks: [] };
  }
  return g[GLOBAL_KEY];
}

const locks = new Map<string, Promise<unknown>>();

function withBarberLock<T>(barberId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(barberId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    barberId,
    next.catch(() => {}),
  );
  return next;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return crypto.randomUUID();
}

const barbers: Barber[] = BARBER_SEED.map((b) => ({
  ...b,
  off_days: [...b.off_days],
  created_at: nowIso(),
}));

function getBarberSync(barberId: string): Barber | undefined {
  return barbers.find((b) => b.id === barberId);
}

function overlapsBusy(
  barberId: string,
  start: Date,
  end: Date,
  excludeAppointmentId?: string,
  excludeBlockId?: string,
): "SLOT_TAKEN" | "SLOT_BLOCKED" | null {
  const state = getState();
  for (const a of state.appointments) {
    if (a.barber_id !== barberId || a.status !== "confirmed") continue;
    if (excludeAppointmentId && a.id === excludeAppointmentId) continue;
    if (
      intervalsOverlap(start, end, new Date(a.start_time), new Date(a.end_time))
    ) {
      return "SLOT_TAKEN";
    }
  }
  for (const b of state.blocks) {
    if (b.barber_id !== barberId) continue;
    if (excludeBlockId && b.id === excludeBlockId) continue;
    if (
      intervalsOverlap(start, end, new Date(b.start_time), new Date(b.end_time))
    ) {
      return "SLOT_BLOCKED";
    }
  }
  return null;
}

export const memoryStore: BookingStore = {
  async listBarbers() {
    return [...barbers];
  },

  async getBarber(barberId) {
    return getBarberSync(barberId) ?? null;
  },

  async getBusyIntervals(barberId, from, to) {
    const state = getState();
    const intervals: BusyInterval[] = [];
    for (const a of state.appointments) {
      if (a.barber_id !== barberId || a.status !== "confirmed") continue;
      const s = new Date(a.start_time);
      const e = new Date(a.end_time);
      if (intervalsOverlap(s, e, from, to)) {
        intervals.push({ start_time: a.start_time, end_time: a.end_time });
      }
    }
    for (const b of state.blocks) {
      if (b.barber_id !== barberId) continue;
      const s = new Date(b.start_time);
      const e = new Date(b.end_time);
      if (intervalsOverlap(s, e, from, to)) {
        intervals.push({ start_time: b.start_time, end_time: b.end_time });
      }
    }
    return intervals;
  },

  async createAppointment(input) {
    return withBarberLock(input.barberId, async () => {
      const barber = getBarberSync(input.barberId);
      if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
      const conflict = overlapsBusy(input.barberId, input.startTime, input.endTime);
      if (conflict) throw new StoreConflict(conflict);
      const row: Appointment = {
        id: uuid(),
        barber_id: input.barberId,
        customer_ref: input.customerRef,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        status: "confirmed",
        created_at: nowIso(),
      };
      getState().appointments.push(row);
      return row;
    });
  },

  async cancelAppointment(appointmentId, customerRef) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.customer_ref !== customerRef) throw new StoreConflict("NOT_OWNER");
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    if (new Date(row.start_time).getTime() - Date.now() < 30 * 60_000) {
      throw new StoreConflict("TOO_LATE");
    }
    const updated = { ...row, status: "cancelled" as const };
    state.appointments[idx] = updated;
    return updated;
  },

  async getAppointment(appointmentId) {
    return getState().appointments.find((a) => a.id === appointmentId) ?? null;
  },

  async createBlock(input) {
    return withBarberLock(input.barberId, async () => {
      if (!getBarberSync(input.barberId)) throw new StoreConflict("BARBER_NOT_FOUND");
      if (input.endTime <= input.startTime) throw new StoreConflict("INVALID_RANGE");
      const conflict = overlapsBusy(input.barberId, input.startTime, input.endTime);
      if (conflict) throw new StoreConflict(conflict);
      const row: TimeBlock = {
        id: uuid(),
        barber_id: input.barberId,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        reason: input.reason,
        created_at: nowIso(),
      };
      getState().blocks.push(row);
      return row;
    });
  },

  async removeBlock(id) {
    const state = getState();
    const idx = state.blocks.findIndex((b) => b.id === id);
    if (idx !== -1) state.blocks.splice(idx, 1);
  },

  async listDayAppointments(from, to) {
    return getState().appointments.filter((a) => {
      if (a.status !== "confirmed") return false;
      const s = new Date(a.start_time);
      return s >= from && s <= to;
    });
  },

  async listDayBlocks(from, to) {
    return getState().blocks.filter((b) => {
      const s = new Date(b.start_time);
      return s >= from && s <= to;
    });
  },
};
