import { CANCEL_LEAD_MINUTES, intervalsOverlap } from "@/lib/services/slot-service";
import { isBlockingStatus, isOccupyingStatus, type AppointmentOutcome } from "@/lib/appointment-status";
import { BARBER_SEED } from "@/lib/data/seed";
import { generateStaffToken, STAFF_SEED } from "@/lib/data/staff-seed";
import {
  StoreConflict,
  type BookingStore,
  type CreateRecurringBreakInput,
  type CreateShopInput,
  type CreateStaffInput,
  type RecurringBreak,
  type Staff,
  type UpdateBarberInput,
} from "@/lib/data/types";
import {
  countBreaksForWeekday,
  normalizeOffDays,
  validateOffDays,
  validateRecurringBreakInput,
  validateSlotDuration,
} from "@/lib/schedule/validation";
import type { Appointment, Barber, BusyInterval, Shop, TimeBlock } from "@/types/booking";

const GLOBAL_KEY = "__barberq_memory_store__";

const DEFAULT_SHOP_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

interface MemoryState {
  appointments: Appointment[];
  blocks: TimeBlock[];
  logoDataUrl: string | null;
  shopName: string | null;
  lineUrl: string | null;
  phone: string | null;
  staff: Staff[];
  recurringBreaks: RecurringBreak[];
  shops: Shop[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemoryState };

function getState(): MemoryState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      appointments: [],
      blocks: [],
      logoDataUrl: null,
      shopName: null,
      lineUrl: null,
      phone: null,
      staff: STAFF_SEED.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        token: row.token,
        barberId: row.barber_id,
        active: true,
        createdAt: new Date(),
      })),
      recurringBreaks: [],
      shops: [
        {
          id: DEFAULT_SHOP_ID,
          name: "PHINX STUDIO",
          status: "active",
          subscribed_until: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
    };
  }
  if (!g[GLOBAL_KEY].recurringBreaks) {
    g[GLOBAL_KEY].recurringBreaks = [];
  }
  if (!g[GLOBAL_KEY].shops) {
    g[GLOBAL_KEY].shops = [
      {
        id: DEFAULT_SHOP_ID,
        name: "PHINX STUDIO",
        status: "active",
        subscribed_until: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ];
  }
  if (g[GLOBAL_KEY].lineUrl === undefined) g[GLOBAL_KEY].lineUrl = null;
  if (g[GLOBAL_KEY].phone === undefined) g[GLOBAL_KEY].phone = null;
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

const barbers: Barber[] = BARBER_SEED.map((b, index) => ({
  ...b,
  off_days: [...b.off_days],
  created_at: nowIso(),
  shop_id: DEFAULT_SHOP_ID,
  role: index === 0 ? "owner" : "barber",
  line_id: index === 0 ? MOCK_OWNER_LINE_ID : null,
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
    if (a.barber_id !== barberId || !isBlockingStatus(a.status)) continue;
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
      if (a.barber_id !== barberId || !isBlockingStatus(a.status)) continue;
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
        cancel_token: uuid().replace(/-/g, ""),
        customer_line_id: input.customerLineId ?? null,
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
    if (new Date(row.start_time).getTime() - Date.now() < CANCEL_LEAD_MINUTES * 60_000) {
      throw new StoreConflict("TOO_LATE");
    }
    const updated = {
      ...row,
      status: "cancelled" as const,
      cancelled_at: nowIso(),
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async staffCancelAppointment(appointmentId) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    const updated = {
      ...row,
      status: "cancelled" as const,
      cancelled_at: nowIso(),
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async getAppointment(appointmentId) {
    return getState().appointments.find((a) => a.id === appointmentId) ?? null;
  },

  async getAppointmentByCancelToken(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    return getState().appointments.find((a) => a.cancel_token === trimmed) ?? null;
  },

  async cancelAppointmentByToken(token) {
    const state = getState();
    const trimmed = token.trim();
    const idx = state.appointments.findIndex((a) => a.cancel_token === trimmed);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    if (new Date(row.start_time).getTime() - Date.now() < CANCEL_LEAD_MINUTES * 60_000) {
      throw new StoreConflict("TOO_LATE");
    }
    const updated = {
      ...row,
      status: "cancelled" as const,
      cancelled_at: nowIso(),
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async markLateCalled(appointmentId) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    const updated = {
      ...row,
      late_called_at: row.late_called_at ?? nowIso(),
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async listCustomerAppointments(customerLineId) {
    return getState().appointments.filter(
      (apt) => apt.customer_line_id === customerLineId && apt.status !== "cancelled",
    );
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

  async getBlock(id) {
    return getState().blocks.find((b) => b.id === id) ?? null;
  },

  async removeBlock(id) {
    const state = getState();
    const idx = state.blocks.findIndex((b) => b.id === id);
    if (idx !== -1) state.blocks.splice(idx, 1);
  },

  async listDayAppointments(from, to) {
    return getState().appointments.filter((a) => {
      if (!isOccupyingStatus(a.status)) return false;
      const s = new Date(a.start_time);
      return s >= from && s <= to;
    });
  },

  async listAppointmentsInRange(from, to) {
    return getState().appointments.filter((a) => {
      const s = new Date(a.start_time);
      return s >= from && s <= to;
    });
  },

  async markAppointmentOutcome(appointmentId, outcome: AppointmentOutcome) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    if (new Date(row.end_time).getTime() > Date.now()) {
      throw new StoreConflict("INVALID_OUTCOME");
    }
    const updated = {
      ...row,
      status: outcome,
      completed_at: outcome === "completed" ? nowIso() : row.completed_at,
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async listDayBlocks(from, to) {
    return getState().blocks.filter((b) => {
      const s = new Date(b.start_time);
      return s >= from && s <= to;
    });
  },

  async getShopSettings() {
    const state = getState();
    return {
      logoDataUrl: state.logoDataUrl,
      shopName: state.shopName,
      lineUrl: state.lineUrl ?? null,
      phone: state.phone ?? null,
    };
  },

  async setShopSettings(input) {
    const state = getState();
    state.logoDataUrl = input.logoDataUrl;
    state.shopName = input.shopName;
    state.lineUrl = input.lineUrl;
    state.phone = input.phone;
  },

  async getStaffByToken(token) {
    const row = getState().staff.find((s) => s.active && s.token === token);
    return row ?? null;
  },

  async listStaff() {
    return [...getState().staff].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  },

  async createStaff(input: CreateStaffInput) {
    const name = input.name.trim();
    if (!name) throw new StoreConflict("INVALID_RANGE");
    if (input.role === "barber" && input.barberId && !getBarberSync(input.barberId)) {
      throw new StoreConflict("BARBER_NOT_FOUND");
    }
    const row: Staff = {
      id: uuid(),
      name,
      role: input.role,
      token: generateStaffToken(),
      barberId: input.barberId ?? null,
      active: true,
      createdAt: new Date(),
    };
    getState().staff.push(row);
    return row;
  },

  async deactivateStaff(staffId) {
    const state = getState();
    const idx = state.staff.findIndex((s) => s.id === staffId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    state.staff[idx] = { ...state.staff[idx], active: false };
  },

  async updateBarber(barberId, input: UpdateBarberInput) {
    const barber = getBarberSync(barberId);
    if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
    if (input.offDays !== undefined) {
      const offDays = normalizeOffDays(input.offDays);
      if (validateOffDays(offDays)) throw new StoreConflict("INVALID_RANGE");
      barber.off_days = offDays;
    }
    if (input.slotDuration !== undefined) {
      if (validateSlotDuration(input.slotDuration)) throw new StoreConflict("INVALID_RANGE");
      barber.slot_duration_minutes = input.slotDuration;
    }
    return { ...barber, off_days: [...barber.off_days] };
  },

  async listRecurringBreaks(barberId) {
    if (!getBarberSync(barberId)) throw new StoreConflict("BARBER_NOT_FOUND");
    return getState()
      .recurringBreaks.filter((item) => item.barberId === barberId)
      .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
  },

  async createRecurringBreak(input: CreateRecurringBreakInput) {
    if (!getBarberSync(input.barberId)) throw new StoreConflict("BARBER_NOT_FOUND");
    if (validateRecurringBreakInput(input)) throw new StoreConflict("INVALID_RANGE");
    const existing = getState().recurringBreaks.filter((item) => item.barberId === input.barberId);
    if (countBreaksForWeekday(existing, input.weekday) >= 3) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const row: RecurringBreak = {
      id: uuid(),
      barberId: input.barberId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      createdAt: new Date(),
    };
    getState().recurringBreaks.push(row);
    return row;
  },

  async deleteRecurringBreak(breakId) {
    const state = getState();
    const idx = state.recurringBreaks.findIndex((item) => item.id === breakId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    state.recurringBreaks.splice(idx, 1);
  },

  async listShops() {
    return [...getState().shops].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  async createShop(input: CreateShopInput) {
    const name = input.name.trim();
    const ownerLineId = input.ownerLineId.trim();
    if (!name || !ownerLineId) throw new StoreConflict("INVALID_RANGE");
    if (barbers.some((b) => b.line_id === ownerLineId)) {
      throw new StoreConflict("INVALID_RANGE");
    }

    const now = nowIso();
    const shop: Shop = {
      id: uuid(),
      name,
      status: "active",
      subscribed_until: new Date(
        Date.now() + input.subscriptionMonths * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      created_at: now,
      updated_at: now,
    };
    getState().shops.push(shop);

    barbers.push({
      id: uuid(),
      name: input.ownerName.trim() || "Owner",
      slot_duration_minutes: 30,
      off_days: [],
      created_at: now,
      line_id: ownerLineId,
      role: "owner",
      shop_id: shop.id,
    });

    return shop;
  },

  async getBarberByLineId(lineId) {
    const trimmed = lineId.trim();
    if (!trimmed) return null;
    const barber = barbers.find((b) => b.line_id === trimmed);
    return barber ? { ...barber, off_days: [...barber.off_days] } : null;
  },
};
