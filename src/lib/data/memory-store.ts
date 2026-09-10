import { CANCEL_LEAD_MINUTES, intervalsOverlap } from "@/lib/services/slot-service";
import { isBlockingStatus, isOccupyingStatus, type AppointmentOutcome } from "@/lib/appointment-status";
import { BARBER_SEED } from "@/lib/data/seed";
import { generateStaffToken, STAFF_SEED } from "@/lib/data/staff-seed";
import {
  StoreConflict,
  type BookingStore,
  type CreateRecurringBreakInput,
  type CreateBarberInput,
  type ClaimOwnerInviteInput,
  type CreateShopInput,
  type CreateStaffInput,
  type LineOaInstallRequest,
  type LineOaInstallRequestStatus,
  type RecurringBreak,
  type Staff,
  type ShopSettings,
  type UpdateBarberInput,
} from "@/lib/data/types";
import {
  isOpenLineOaInstallStatus,
  LINE_OA_INSTALL_STATUSES,
  type CreateLineOaInstallRequestInput,
} from "@/lib/onboarding/line-oa-install";
import {
  TRIAL_LEAD_STATUSES,
  type CreateTrialLeadInput,
  type TrialLead,
  type TrialLeadStatus,
} from "@/lib/marketing/trial-leads";
import type { Appointment, Barber, BusyInterval, Shop, TimeBlock } from "@/types/booking";
import {
  countBreaksForWeekday,
  normalizeOffDays,
  validateOffDays,
  validateRecurringBreakInput,
  validateSlotDuration,
} from "@/lib/schedule/validation";
import { DEFAULT_SHOP_HOURS, normalizeShopHours } from "@/lib/shop/shop-hours";
import { slugifyShopName } from "@/lib/shop/slug";

const GLOBAL_KEY = "__barberq_memory_store__";

const DEFAULT_SHOP_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

interface MemoryState {
  appointments: Appointment[];
  blocks: TimeBlock[];
  shopSettings: Record<string, ShopSettings>;
  staff: Staff[];
  recurringBreaks: RecurringBreak[];
  shops: Shop[];
  lineOaInstallRequests: LineOaInstallRequest[];
  trialLeads: TrialLead[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemoryState };

function getState(): MemoryState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      appointments: [],
      blocks: [],
      shopSettings: {},
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
      lineOaInstallRequests: [],
      trialLeads: [],
      shops: [
        {
          id: DEFAULT_SHOP_ID,
          name: "PHINX STUDIO",
          slug: "phinxstudio",
          status: "active",
          subscribed_until: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
    };
    g[GLOBAL_KEY].shopSettings[DEFAULT_SHOP_ID] = {
      shopId: DEFAULT_SHOP_ID,
      logoDataUrl: null,
      coverImageUrl: null,
      shopName: "PHINX STUDIO",
      lineUrl: null,
      phone: null,
      hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
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
        slug: "phinxstudio",
        status: "active",
        subscribed_until: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ];
  }
  if (!g[GLOBAL_KEY].lineOaInstallRequests) {
    g[GLOBAL_KEY].lineOaInstallRequests = [];
  }
  if (!g[GLOBAL_KEY].shopSettings) {
    g[GLOBAL_KEY].shopSettings = {
      [DEFAULT_SHOP_ID]: {
        shopId: DEFAULT_SHOP_ID,
        logoDataUrl: null,
        coverImageUrl: null,
        shopName: "PHINX STUDIO",
        lineUrl: null,
        phone: null,
        hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
      },
    };
  }
  const legacy = g[GLOBAL_KEY] as MemoryState & {
    lineUrl?: string | null;
    phone?: string | null;
    logoDataUrl?: string | null;
    shopName?: string | null;
  };
  delete legacy.lineUrl;
  delete legacy.phone;
  delete legacy.logoDataUrl;
  delete legacy.shopName;
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

function inviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

const barbers: Barber[] = BARBER_SEED.map((b, index) => ({
  ...b,
  off_days: [...b.off_days],
  created_at: nowIso(),
  shop_id: DEFAULT_SHOP_ID,
  role: index === 0 ? "owner" : "barber",
  line_id: index === 0 ? MOCK_OWNER_LINE_ID : null,
  is_bookable: true,
  is_active: true,
}));

function countFutureConfirmedAppointments(barberId: string): number {
  const now = Date.now();
  return getState().appointments.filter(
    (a) =>
      a.barber_id === barberId &&
      a.status === "confirmed" &&
      new Date(a.start_time).getTime() > now,
  ).length;
}

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
  async getShopBySlug(slug) {
    return getState().shops.find((s) => s.slug === slug) ?? null;
  },

  async listBarbersByShop(shopId) {
    return barbers.filter((b) => b.shop_id === shopId);
  },

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

  async getShopSettings(shopId) {
    const state = getState();
    const existing = state.shopSettings[shopId];
    return (
      existing ?? {
        shopId,
        logoDataUrl: null,
        coverImageUrl: null,
        shopName: null,
        lineUrl: null,
        phone: null,
        hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
      }
    );
  },

  async setShopSettings(shopId, input) {
    const state = getState();
    state.shopSettings[shopId] = {
      shopId,
      logoDataUrl: input.logoDataUrl,
      coverImageUrl: input.coverImageUrl,
      shopName: input.shopName,
      lineUrl: input.lineUrl,
      phone: input.phone,
      hours: input.hours,
    };
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
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new StoreConflict("INVALID_RANGE");
      if (
        barbers.some(
          (b) => b.shop_id === barber.shop_id && b.id !== barberId && b.name === name,
        )
      ) {
        throw new StoreConflict("INVALID_RANGE");
      }
      barber.name = name;
    }
    if (input.lineId !== undefined) {
      const lineId = input.lineId?.trim() || null;
      if (lineId && barbers.some((b) => b.line_id === lineId && b.id !== barberId)) {
        throw new StoreConflict("LINE_ID_TAKEN");
      }
      barber.line_id = lineId;
    }
    if (input.isBookable !== undefined) {
      barber.is_bookable = input.isBookable;
    }
    if (input.profileImageUrl !== undefined) {
      barber.profile_image_url = input.profileImageUrl;
    }
    if (input.showProfileInBooking !== undefined) {
      barber.show_profile_in_booking = input.showProfileInBooking;
    }
    return { ...barber, off_days: [...barber.off_days] };
  },

  async createBarber(input: CreateBarberInput) {
    const name = input.name.trim();
    if (!name) throw new StoreConflict("INVALID_RANGE");
    const slotDuration = input.slotDuration ?? 30;
    if (validateSlotDuration(slotDuration)) throw new StoreConflict("INVALID_RANGE");
    const lineId = input.lineId?.trim() || null;
    if (lineId && barbers.some((b) => b.line_id === lineId)) {
      throw new StoreConflict("LINE_ID_TAKEN");
    }
    if (barbers.some((b) => b.shop_id === input.shopId && b.name === name)) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const now = nowIso();
    const row: Barber = {
      id: uuid(),
      name,
      slot_duration_minutes: slotDuration,
      off_days: [],
      created_at: now,
      shop_id: input.shopId,
      role: "barber",
      line_id: lineId,
      is_bookable: input.isBookable ?? true,
      is_active: true,
    };
    barbers.push(row);
    return { ...row, off_days: [...row.off_days] };
  },

  async deactivateBarber(shopId, barberId) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    const barber = getBarberSync(barberId);
    if (!barber || barber.shop_id !== shopId) throw new StoreConflict("BARBER_NOT_FOUND");
    if (barber.role === "owner") throw new StoreConflict("NOT_OWNER");
    const futureCount = countFutureConfirmedAppointments(barberId);
    if (futureCount > 0) {
      throw new StoreConflict("HAS_FUTURE_BOOKINGS", undefined, futureCount);
    }
    barber.is_active = false;
    barber.is_bookable = false;
    barber.line_id = null;
    return { ...barber, off_days: [...barber.off_days] };
  },

  async reactivateBarber(shopId, barberId) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    const barber = getBarberSync(barberId);
    if (!barber || barber.shop_id !== shopId) throw new StoreConflict("BARBER_NOT_FOUND");
    barber.is_active = true;
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

  async listShopOwners() {
    return barbers
      .filter((b) => b.role === "owner" && b.shop_id)
      .map((b) => ({ shopId: b.shop_id!, name: b.name }));
  },

  async createShop(input: CreateShopInput) {
    const name = input.name.trim();
    if (!name) throw new StoreConflict("INVALID_RANGE");

    const ownerLineId = input.ownerLineId?.trim() ?? "";
    const now = nowIso();

    if (!ownerLineId) {
      const token = inviteToken();
      const shop: Shop = {
        id: uuid(),
        name,
        slug: slugifyShopName(name),
        status: "pending",
        subscribed_until: new Date(
          Date.now() + input.subscriptionMonths * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        invite_token: token,
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: now,
        updated_at: now,
      };
      getState().shops.push(shop);
      getState().shopSettings[shop.id] = {
        shopId: shop.id,
        logoDataUrl: null,
        coverImageUrl: null,
        shopName: name,
        lineUrl: null,
        phone: null,
        hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
      };
      return shop;
    }

    if (barbers.some((b) => b.line_id === ownerLineId)) {
      throw new StoreConflict("LINE_ID_TAKEN");
    }

    const shop: Shop = {
      id: uuid(),
      name,
      slug: slugifyShopName(name),
      status: "active",
      subscribed_until: new Date(
        Date.now() + input.subscriptionMonths * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      invite_token: null,
      invite_expires_at: null,
      created_at: now,
      updated_at: now,
    };
    getState().shops.push(shop);
    getState().shopSettings[shop.id] = {
      shopId: shop.id,
      logoDataUrl: null,
      coverImageUrl: null,
      shopName: name,
      lineUrl: null,
      phone: null,
      hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
    };

    barbers.push({
      id: uuid(),
      name: input.ownerName?.trim() || "Owner",
      slot_duration_minutes: 30,
      off_days: [],
      created_at: now,
      line_id: ownerLineId,
      role: "owner",
      shop_id: shop.id,
      is_bookable: false,
    });

    return shop;
  },

  async getShopInvitePreview(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const shop = getState().shops.find((s) => s.invite_token === trimmed);
    if (!shop) return null;
    const expired = shop.invite_expires_at
      ? new Date(shop.invite_expires_at).getTime() < Date.now()
      : false;
    return {
      shopName: shop.name,
      expired,
      claimed: shop.status !== "pending",
    };
  },

  async regenerateOwnerInvite(shopId) {
    const state = getState();
    const shop = state.shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("INVITE_NOT_FOUND");
    if (shop.status !== "pending") throw new StoreConflict("INVITE_ALREADY_CLAIMED");

    const now = nowIso();
    shop.invite_token = inviteToken();
    shop.invite_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    shop.updated_at = now;
    return { ...shop };
  },

  async claimOwnerInvite(input) {
    const token = input.inviteToken.trim();
    const ownerLineId = input.ownerLineId.trim();
    if (!token || !ownerLineId) throw new StoreConflict("INVALID_RANGE");

    const state = getState();
    const shop = state.shops.find((s) => s.invite_token === token);
    if (!shop) throw new StoreConflict("INVITE_NOT_FOUND");
    if (shop.status !== "pending") throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (shop.invite_expires_at && new Date(shop.invite_expires_at).getTime() < Date.now()) {
      throw new StoreConflict("INVITE_EXPIRED");
    }
    if (barbers.some((b) => b.line_id === ownerLineId)) {
      throw new StoreConflict("LINE_ID_TAKEN");
    }

    const now = nowIso();
    barbers.push({
      id: uuid(),
      name: input.ownerName.trim() || "Owner",
      slot_duration_minutes: 30,
      off_days: [],
      created_at: now,
      line_id: ownerLineId,
      role: "owner",
      shop_id: shop.id,
      is_bookable: false,
    });

    shop.status = "active";
    shop.invite_token = null;
    shop.invite_expires_at = null;
    shop.updated_at = now;

    return { ...shop };
  },

  async getBarberByLineId(lineId) {
    const trimmed = lineId.trim();
    if (!trimmed) return null;
    const barber = barbers.find((b) => b.line_id === trimmed);
    return barber ? { ...barber, off_days: [...barber.off_days] } : null;
  },

  async getBarberByLineIdInShop(lineId, shopId) {
    const trimmed = lineId.trim();
    if (!trimmed) return null;
    const barber = barbers.find((b) => b.line_id === trimmed && b.shop_id === shopId);
    return barber ? { ...barber, off_days: [...barber.off_days] } : null;
  },

  async unlinkBarberLine(shopId, barberId) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");

    const barber = getBarberSync(barberId);
    if (!barber || barber.shop_id !== shopId) {
      throw new StoreConflict("BARBER_NOT_FOUND");
    }
    if (!barber.line_id) {
      return { ...barber, off_days: [...barber.off_days] };
    }
    barber.line_id = null;
    return { ...barber, off_days: [...barber.off_days] };
  },

  async getLatestLineOaInstallRequest(shopId) {
    const state = getState();
    const rows = state.lineOaInstallRequests
      .filter((r) => r.shop_id === shopId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const latest = rows[0];
    return latest ? { ...latest } : null;
  },

  async createLineOaInstallRequest(shopId, input) {
    const state = getState();
    const shop = state.shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");

    const latest = await memoryStore.getLatestLineOaInstallRequest(shopId);
    if (latest && isOpenLineOaInstallStatus(latest.status)) {
      return { ...latest };
    }

    const now = nowIso();
    const row: LineOaInstallRequest = {
      id: uuid(),
      shop_id: shopId,
      line_oa: input.lineOa,
      rich_menu_state: input.richMenuState,
      help_type: input.helpType,
      contact_phone: input.contactPhone,
      status: "NEW",
      created_at: now,
      updated_at: now,
    };
    state.lineOaInstallRequests.push(row);
    return { ...row };
  },

  async listLineOaInstallRequests() {
    const state = getState();
    return state.lineOaInstallRequests
      .map((r) => ({ ...r }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async updateLineOaInstallRequestStatus(id, status) {
    if (!LINE_OA_INSTALL_STATUSES.includes(status)) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const state = getState();
    const row = state.lineOaInstallRequests.find((r) => r.id === id);
    if (!row) throw new StoreConflict("NOT_FOUND");
    row.status = status;
    row.updated_at = nowIso();
    return { ...row };
  },

  async createTrialLead(input: CreateTrialLeadInput) {
    const now = nowIso();
    const row: TrialLead = {
      id: uuid(),
      shop_name: input.shopName,
      contact_name: input.contactName,
      contact_value: input.contactValue,
      province: input.province ?? null,
      barber_count: input.barberCount ?? null,
      status: "NEW",
      utm_source: input.utmSource ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_campaign: input.utmCampaign ?? null,
      referrer: input.referrer ?? null,
      locale: input.locale ?? null,
      created_at: now,
      updated_at: now,
    };
    getState().trialLeads.push(row);
    return { ...row };
  },

  async listTrialLeads() {
    return getState()
      .trialLeads.map((r) => ({ ...r }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async updateTrialLeadStatus(id: string, status: TrialLeadStatus) {
    if (!TRIAL_LEAD_STATUSES.includes(status)) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const row = getState().trialLeads.find((r) => r.id === id);
    if (!row) throw new StoreConflict("NOT_FOUND");
    row.status = status;
    row.updated_at = nowIso();
    return { ...row };
  },
};
