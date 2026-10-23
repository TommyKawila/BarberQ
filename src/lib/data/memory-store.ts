import {
  CANCEL_LEAD_MINUTES,
  intervalsOverlap,
  MAX_RESCHEDULE_COUNT,
} from "@/lib/services/slot-service";
import { isBlockingStatus, isOccupyingStatus, type AppointmentOutcome } from "@/lib/appointment-status";
import { BARBER_SEED } from "@/lib/data/seed";
import { generateStaffToken, STAFF_SEED } from "@/lib/data/staff-seed";
import {
  StoreConflict,
  type BookingStore,
  type CreateRecurringBreakInput,
  type CreateBarberInput,
  type CreateShopInput,
  type CreateShopServiceInput,
  type CreateStaffInput,
  type LineOaInstallRequest,
  type MarkOutcomeOptions,
  type RecurringBreak,
  type BarberLineInvite,
  type ShopManager,
  type ShopManagerInvite,
  type Staff,
  type ShopSettings,
  type UpdateBarberInput,
  type UpdateShopServiceInput,
} from "@/lib/data/types";
import {
  isOpenLineOaInstallStatus,
  LINE_OA_INSTALL_STATUSES,
} from "@/lib/onboarding/line-oa-install";
import {
  TRIAL_LEAD_STATUSES,
  type CreateTrialLeadInput,
  type TrialLead,
  type TrialLeadNote,
  type TrialLeadStatus,
} from "@/lib/marketing/trial-leads";
import type {
  CreateShopCancelFeedbackInput,
  ShopCancelFeedback,
} from "@/lib/billing/cancel-feedback";
import type { Appointment, Barber, BusyInterval, Shop, ShopService, TimeBlock } from "@/types/booking";
import {
  countBreaksForWeekday,
  normalizeOffDays,
  validateOffDays,
  validateRecurringBreakInput,
  validateSlotDuration,
} from "@/lib/schedule/validation";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";
import { slugifyShopName } from "@/lib/shop/slug";

const GLOBAL_KEY = "__barberq_memory_store__";

const DEFAULT_SHOP_ID = "00000000-0000-0000-0000-000000000001";
/** Matches supabase/scripts/seed_clipperq_demo_prod.sql */
const DEMO_SHOP_ID = "c1a55e00-d300-4000-a000-000000000001";
const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

interface MemoryState {
  appointments: Appointment[];
  blocks: TimeBlock[];
  shopSettings: Record<string, ShopSettings>;
  staff: Staff[];
  recurringBreaks: RecurringBreak[];
  shops: Shop[];
  shopServices: ShopService[];
  lineOaInstallRequests: LineOaInstallRequest[];
  trialLeads: TrialLead[];
  trialLeadNotes: TrialLeadNote[];
  shopManagers: ShopManager[];
  shopManagerInvites: ShopManagerInvite[];
  barberLineInvites: BarberLineInvite[];
  shopCancelFeedback: ShopCancelFeedback[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemoryState };

function getState(): MemoryState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      appointments: buildDemoSampleAppointments(),
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
      trialLeadNotes: [],
      shopManagers: [],
      shopManagerInvites: [],
      barberLineInvites: [],
      shopCancelFeedback: [],
      shops: [
        {
          id: DEFAULT_SHOP_ID,
          name: "ClipperQ Demo",
          slug: "phinxstudio",
          status: "active",
          subscribed_until: null,
          is_demo: false,
          barber_tier: "tier1",
          created_at: trialDay26Iso(),
          updated_at: nowIso(),
        },
        {
          id: DEMO_SHOP_ID,
          name: "ClipperQ Demo",
          slug: "clipperqdemo",
          status: "active",
          subscribed_until: null,
          is_demo: true,
          barber_tier: "tier1",
          created_at: trialDay26Iso(),
          updated_at: nowIso(),
        },
      ],
      shopServices: [
        {
          id: "c1a55e00-d300-4000-a000-000000000021",
          shop_id: DEMO_SHOP_ID,
          name: "ตัดผม + เฟด",
          price_baht: 200,
          is_default: true,
          is_active: true,
          sort_order: 0,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
        {
          id: "c1a55e00-d300-4000-a000-000000000022",
          shop_id: DEMO_SHOP_ID,
          name: "ตัด + เฟด + โกนหนวด",
          price_baht: 250,
          is_default: false,
          is_active: true,
          sort_order: 1,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
    };
    g[GLOBAL_KEY].shopSettings[DEFAULT_SHOP_ID] = {
      shopId: DEFAULT_SHOP_ID,
      logoDataUrl: null,
      coverImageUrl: null,
      shopName: "ClipperQ Demo",
      lineUrl: null,
      phone: null,
      hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
      remindersEnabled: false,
      reminderLeadMinutes: 120,
      bookingConfirmPushEnabled: true,
      queueAheadPushEnabled: true,
      showFlexBrandFooter: true,
    };
    g[GLOBAL_KEY].shopSettings[DEMO_SHOP_ID] = {
      shopId: DEMO_SHOP_ID,
      logoDataUrl: null,
      coverImageUrl: null,
      shopName: "ClipperQ Demo",
      lineUrl: null,
      phone: null,
      // Stay open later so marketing/admin screenshots still show a live board after dinner.
      hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d, close: "23:00" })),
      remindersEnabled: false,
      reminderLeadMinutes: 120,
      bookingConfirmPushEnabled: false,
      queueAheadPushEnabled: false,
      showFlexBrandFooter: true,
    };
  }
  if (!g[GLOBAL_KEY].recurringBreaks) {
    g[GLOBAL_KEY].recurringBreaks = [];
  }
  if (!g[GLOBAL_KEY].shops) {
    g[GLOBAL_KEY].shops = [
      {
        id: DEFAULT_SHOP_ID,
        name: "ClipperQ Demo",
        slug: "phinxstudio",
        status: "active",
        subscribed_until: null,
        is_demo: false,
        barber_tier: "tier1",
        created_at: trialDay26Iso(),
        updated_at: nowIso(),
      },
      {
        id: DEMO_SHOP_ID,
        name: "ClipperQ Demo",
        slug: "clipperqdemo",
        status: "active",
        subscribed_until: null,
        is_demo: true,
        barber_tier: "tier1",
        created_at: trialDay26Iso(),
        updated_at: nowIso(),
      },
    ];
  } else if (!g[GLOBAL_KEY].shops.some((s) => s.slug === "clipperqdemo")) {
    g[GLOBAL_KEY].shops.push({
      id: DEMO_SHOP_ID,
      name: "ClipperQ Demo",
      slug: "clipperqdemo",
      status: "active",
      subscribed_until: null,
      is_demo: true,
      barber_tier: "tier1",
      created_at: trialDay26Iso(),
      updated_at: nowIso(),
    });
  }
  if (!g[GLOBAL_KEY].shopCancelFeedback) {
    g[GLOBAL_KEY].shopCancelFeedback = [];
  }
  if (!g[GLOBAL_KEY].lineOaInstallRequests) {
    g[GLOBAL_KEY].lineOaInstallRequests = [];
  }
  if (!g[GLOBAL_KEY].trialLeadNotes) {
    g[GLOBAL_KEY].trialLeadNotes = [];
  }
  if (!g[GLOBAL_KEY].shopManagers) {
    g[GLOBAL_KEY].shopManagers = [];
  }
  if (!g[GLOBAL_KEY].shopManagerInvites) {
    g[GLOBAL_KEY].shopManagerInvites = [];
  }
  if (!g[GLOBAL_KEY].barberLineInvites) {
    g[GLOBAL_KEY].barberLineInvites = [];
  }
  if (!g[GLOBAL_KEY].shopSettings) {
    g[GLOBAL_KEY].shopSettings = {
      [DEFAULT_SHOP_ID]: {
        shopId: DEFAULT_SHOP_ID,
        logoDataUrl: null,
        coverImageUrl: null,
        shopName: "ClipperQ Demo",
        lineUrl: null,
        phone: null,
        hours: DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
        remindersEnabled: false,
        reminderLeadMinutes: 120,
        bookingConfirmPushEnabled: true,
      queueAheadPushEnabled: true,
      showFlexBrandFooter: true,
      },
    };
  }
  for (const settings of Object.values(g[GLOBAL_KEY].shopSettings)) {
    if (typeof settings.bookingConfirmPushEnabled !== "boolean") {
      settings.bookingConfirmPushEnabled = true;
    }
    if (typeof settings.queueAheadPushEnabled !== "boolean") {
      settings.queueAheadPushEnabled = true;
    }
    if (typeof settings.showFlexBrandFooter !== "boolean") {
      settings.showFlexBrandFooter = true;
    }
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

/** ~day 27 of a 30-day trial — billing notice visible in local prototype. */
function trialDay26Iso(): string {
  return new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString();
}

function uuid(): string {
  return crypto.randomUUID();
}

function inviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

const barbers: Barber[] = [
  ...BARBER_SEED.map((b, index) => ({
    ...b,
    off_days: [...b.off_days],
    created_at: nowIso(),
    shop_id: DEFAULT_SHOP_ID,
    role: (index === 0 ? "owner" : "barber") as Barber["role"],
    line_id: index === 0 ? MOCK_OWNER_LINE_ID : null,
    is_bookable: true,
    is_active: true,
  })),
  {
    id: "c1a55e00-d300-4000-a000-000000000011",
    name: "มิกซ์ (ตัวอย่าง)",
    slot_duration_minutes: 30,
    off_days: [],
    created_at: nowIso(),
    shop_id: DEMO_SHOP_ID,
    role: "owner",
    // Memory mock-owner can open clipperqdemo admin (marketing screens / local demo).
    line_id: MOCK_OWNER_LINE_ID,
    is_bookable: true,
    is_active: true,
  },
  {
    id: "c1a55e00-d300-4000-a000-000000000012",
    name: "โอ๊ต (ตัวอย่าง)",
    slot_duration_minutes: 45,
    off_days: [],
    created_at: nowIso(),
    shop_id: DEMO_SHOP_ID,
    role: "barber",
    line_id: null,
    is_bookable: true,
    is_active: true,
  },
  {
    id: "c1a55e00-d300-4000-a000-000000000013",
    name: "เจ (ตัวอย่าง)",
    slot_duration_minutes: 30,
    // No mid-week off — marketing board/summary always show all four demo barbers.
    off_days: [],
    created_at: nowIso(),
    shop_id: DEMO_SHOP_ID,
    role: "barber",
    line_id: null,
    is_bookable: true,
    is_active: true,
  },
  {
    id: "c1a55e00-d300-4000-a000-000000000014",
    name: "นนท์ (ตัวอย่าง)",
    slot_duration_minutes: 60,
    off_days: [],
    created_at: nowIso(),
    shop_id: DEMO_SHOP_ID,
    role: "barber",
    line_id: null,
    is_bookable: true,
    is_active: true,
  },
];

/** Stable demo-shop sample bookings for marketing screens + /demo/board (not real customers). */
const DEMO_BARBER_IDS = {
  mix: "c1a55e00-d300-4000-a000-000000000011",
  oat: "c1a55e00-d300-4000-a000-000000000012",
  jay: "c1a55e00-d300-4000-a000-000000000013",
  non: "c1a55e00-d300-4000-a000-000000000014",
} as const;

function bangkokWallToUtc(y: number, m: number, d: number, hh: number, mm: number): Date {
  // Asia/Bangkok is UTC+7 year-round (no DST).
  return new Date(Date.UTC(y, m - 1, d, hh - 7, mm, 0, 0));
}

function bangkokNowParts(): {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    hh: get("hour") === 24 ? 0 : get("hour"),
    mm: get("minute"),
  };
}

function buildDemoSampleAppointments(): Appointment[] {
  const now = bangkokNowParts();
  // Anchor upcoming queues ~50 min ahead so the board never looks empty.
  let baseMin = now.hh * 60 + now.mm + 50;
  baseMin = Math.ceil(baseMin / 30) * 30;
  if (baseMin < 11 * 60) baseMin = 11 * 60;
  // Keep the 4 upcoming slots (upto +90+60min) inside demo close 23:00.
  if (baseMin + 150 > 23 * 60) baseMin = 21 * 60;

  const wall = (offsetMin: number) => {
    const total = baseMin + offsetMin;
    return { hh: Math.floor(total / 60), mm: total % 60 };
  };

  const slot = (
    barberId: string,
    offsetMin: number,
    durationMin: number,
    name: string,
    source: Appointment["source"],
    status: Appointment["status"],
    extras: Partial<Appointment> = {},
  ): Appointment => {
    const { hh, mm } = wall(offsetMin);
    const start = bangkokWallToUtc(now.y, now.m, now.d, hh, mm);
    const end = new Date(start.getTime() + durationMin * 60_000);
    return {
      id: uuid(),
      barber_id: barberId,
      customer_ref: `demo-sample-${barberId}-${hh}${String(mm).padStart(2, "0")}`,
      customer_name: name,
      customer_phone: null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status,
      created_at: nowIso(),
      cancel_token: uuid().replace(/-/g, ""),
      customer_line_id: null,
      source,
      reschedule_count: 0,
      ...extras,
    };
  };

  // Two completed earlier today (or just before the window) + four upcoming.
  const doneA = wall(-120);
  const doneB = wall(-75);
  return [
    {
      ...slot(DEMO_BARBER_IDS.mix, -120, 30, "คุณเอ (ตัวอย่าง)", "line", "completed", {
        completed_at: nowIso(),
        price_baht: 200,
        service_id: "c1a55e00-d300-4000-a000-000000000021",
      }),
      start_time: bangkokWallToUtc(now.y, now.m, now.d, doneA.hh, doneA.mm).toISOString(),
      end_time: new Date(
        bangkokWallToUtc(now.y, now.m, now.d, doneA.hh, doneA.mm).getTime() + 30 * 60_000,
      ).toISOString(),
    },
    {
      ...slot(DEMO_BARBER_IDS.oat, -75, 45, "คุณบี (ตัวอย่าง)", "line", "completed", {
        completed_at: nowIso(),
        price_baht: 250,
        service_id: "c1a55e00-d300-4000-a000-000000000022",
      }),
      start_time: bangkokWallToUtc(now.y, now.m, now.d, doneB.hh, doneB.mm).toISOString(),
      end_time: new Date(
        bangkokWallToUtc(now.y, now.m, now.d, doneB.hh, doneB.mm).getTime() + 45 * 60_000,
      ).toISOString(),
    },
    slot(DEMO_BARBER_IDS.mix, 0, 30, "คุณซี (ตัวอย่าง)", "line", "confirmed"),
    slot(DEMO_BARBER_IDS.oat, 30, 45, "คุณดี (ตัวอย่าง)", "walk_in", "confirmed"),
    slot(DEMO_BARBER_IDS.jay, 60, 30, "คุณอี (ตัวอย่าง)", "line", "confirmed"),
    slot(DEMO_BARBER_IDS.non, 90, 60, "คุณเอฟ (ตัวอย่าง)", "phone", "confirmed"),
  ];
}

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
      if (input.endTime <= input.startTime) throw new StoreConflict("INVALID_RANGE");
      const conflict = overlapsBusy(input.barberId, input.startTime, input.endTime);
      if (conflict) throw new StoreConflict(conflict);
      const ref = input.customerRef?.trim() || null;
      const phone = input.customerPhone?.trim() || null;
      const row: Appointment = {
        id: uuid(),
        barber_id: input.barberId,
        customer_ref: ref,
        customer_name: input.customerName,
        customer_phone: phone,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        status: "confirmed",
        created_at: nowIso(),
        cancel_token: uuid().replace(/-/g, ""),
        customer_line_id: input.customerLineId ?? null,
        source: input.source ?? "line",
        via_qr: Boolean(input.viaQr),
        reschedule_count: 0,
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

  async rescheduleAppointmentByToken(token, newBarberId, newStartTime, newEndTime) {
    const trimmed = token.trim();
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.cancel_token === trimmed);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_RESCHEDULABLE");
    if ((row.reschedule_count ?? 0) >= MAX_RESCHEDULE_COUNT) {
      throw new StoreConflict("RESCHEDULE_LIMIT");
    }
    if (new Date(row.start_time).getTime() - Date.now() < CANCEL_LEAD_MINUTES * 60_000) {
      throw new StoreConflict("TOO_LATE");
    }
    if (newEndTime <= newStartTime) throw new StoreConflict("INVALID_RANGE");

    const apply = async () => {
      if (!getBarberSync(newBarberId)) throw new StoreConflict("BARBER_NOT_FOUND");
      const conflict = overlapsBusy(newBarberId, newStartTime, newEndTime, row.id);
      if (conflict) throw new StoreConflict(conflict);
      const before = { ...row };
      const after: Appointment = {
        ...row,
        barber_id: newBarberId,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        reschedule_count: (row.reschedule_count ?? 0) + 1,
      };
      state.appointments[idx] = after;
      return { before, after };
    };

    if (row.barber_id === newBarberId) {
      return withBarberLock(newBarberId, apply);
    }
    const [first, second] = [row.barber_id, newBarberId].sort();
    return withBarberLock(first, () => withBarberLock(second, apply));
  },

  async staffRescheduleAppointment(appointmentId, newBarberId, newStartTime, newEndTime) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_RESCHEDULABLE");
    if (newEndTime <= newStartTime) throw new StoreConflict("INVALID_RANGE");

    const apply = async () => {
      if (!getBarberSync(newBarberId)) throw new StoreConflict("BARBER_NOT_FOUND");
      const conflict = overlapsBusy(newBarberId, newStartTime, newEndTime, row.id);
      if (conflict) throw new StoreConflict(conflict);
      const before = { ...row };
      const after: Appointment = {
        ...row,
        barber_id: newBarberId,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
      };
      state.appointments[idx] = after;
      return { before, after };
    };

    if (row.barber_id === newBarberId) {
      return withBarberLock(newBarberId, apply);
    }
    const [first, second] = [row.barber_id, newBarberId].sort();
    return withBarberLock(first, () => withBarberLock(second, apply));
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

  async markAppointmentOutcome(
    appointmentId,
    outcome: AppointmentOutcome,
    options?: MarkOutcomeOptions,
  ) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");
    const now = Date.now();
    if (outcome === "no_show" && new Date(row.end_time).getTime() > now) {
      throw new StoreConflict("INVALID_OUTCOME");
    }
    if (options?.priceBaht != null && options.priceBaht < 0) {
      throw new StoreConflict("INVALID_PRICE");
    }
    const startMs = new Date(row.start_time).getTime();
    const endMs = new Date(row.end_time).getTime();
    // Only shorten while in progress; before start keep range valid (end > start)
    const inProgress = now >= startMs && now < endMs;
    const shorten =
      (outcome === "completed" || outcome === "left") && inProgress;
    const shortenedEnd = new Date(Math.max(now, startMs + 1000)).toISOString();

    let serviceId = row.service_id ?? null;
    let priceBaht = row.price_baht ?? null;
    if (outcome === "completed") {
      const barber = getBarberSync(row.barber_id);
      const shopId = barber?.shop_id ?? null;
      if (options?.serviceId) {
        const service = state.shopServices.find(
          (s) => s.id === options.serviceId && s.shop_id === shopId && s.is_active,
        );
        if (!service) throw new StoreConflict("SERVICE_NOT_FOUND");
        serviceId = service.id;
        priceBaht = options.priceBaht ?? service.price_baht;
      } else if (options?.priceBaht != null) {
        priceBaht = options.priceBaht;
      } else if (priceBaht == null && shopId) {
        const services = state.shopServices
          .filter((s) => s.shop_id === shopId && s.is_active)
          .sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.sort_order - b.sort_order);
        const def = services[0];
        if (def) {
          serviceId = def.id;
          priceBaht = def.price_baht;
        }
      }
    }

    const updated = {
      ...row,
      status: outcome,
      end_time: shorten ? shortenedEnd : row.end_time,
      completed_at: outcome === "completed" ? nowIso() : row.completed_at,
      cancelled_at: outcome === "left" ? nowIso() : row.cancelled_at,
      service_id: outcome === "completed" ? serviceId : row.service_id,
      price_baht: outcome === "completed" ? priceBaht : row.price_baht,
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async updateCompletedAppointmentService(appointmentId, options) {
    const state = getState();
    const idx = state.appointments.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new StoreConflict("NOT_FOUND");
    const row = state.appointments[idx];
    if (row.status !== "completed") throw new StoreConflict("INVALID_OUTCOME");
    if (options.priceBaht != null && options.priceBaht < 0) {
      throw new StoreConflict("INVALID_PRICE");
    }
    const barber = getBarberSync(row.barber_id);
    const shopId = barber?.shop_id ?? null;
    const service = state.shopServices.find(
      (s) => s.id === options.serviceId && s.shop_id === shopId && s.is_active,
    );
    if (!service) throw new StoreConflict("SERVICE_NOT_FOUND");
    const updated = {
      ...row,
      service_id: service.id,
      price_baht: options.priceBaht ?? service.price_baht,
    };
    state.appointments[idx] = updated;
    return updated;
  },

  async listShopServices(shopId, opts) {
    return getState()
      .shopServices.filter(
        (s) => s.shop_id === shopId && (opts?.includeInactive || s.is_active),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  },

  async getDefaultShopService(shopId) {
    const list = await this.listShopServices(shopId);
    return list.find((s) => s.is_default) ?? list[0] ?? null;
  },

  async createShopService(input: CreateShopServiceInput) {
    const state = getState();
    if (!state.shops.some((s) => s.id === input.shopId)) {
      throw new StoreConflict("NOT_FOUND");
    }
    if (!Number.isFinite(input.priceBaht) || input.priceBaht < 0) {
      throw new StoreConflict("INVALID_PRICE");
    }
    const name = input.name.trim();
    if (!name) throw new StoreConflict("INVALID_RANGE");
    const isDefault = Boolean(input.isDefault) || state.shopServices.filter((s) => s.shop_id === input.shopId && s.is_active).length === 0;
    if (isDefault) {
      for (const s of state.shopServices) {
        if (s.shop_id === input.shopId && s.is_default) s.is_default = false;
      }
    }
    const now = nowIso();
    const row: ShopService = {
      id: uuid(),
      shop_id: input.shopId,
      name,
      price_baht: Math.round(input.priceBaht),
      is_default: isDefault,
      is_active: true,
      sort_order: input.sortOrder ?? state.shopServices.filter((s) => s.shop_id === input.shopId).length,
      created_at: now,
      updated_at: now,
    };
    state.shopServices.push(row);
    return row;
  },

  async updateShopService(serviceId, shopId, input: UpdateShopServiceInput) {
    const state = getState();
    const idx = state.shopServices.findIndex((s) => s.id === serviceId && s.shop_id === shopId);
    if (idx === -1) throw new StoreConflict("SERVICE_NOT_FOUND");
    const row = state.shopServices[idx];
    if (input.priceBaht != null && (!Number.isFinite(input.priceBaht) || input.priceBaht < 0)) {
      throw new StoreConflict("INVALID_PRICE");
    }
    if (input.isDefault) {
      for (const s of state.shopServices) {
        if (s.shop_id === shopId && s.is_default) s.is_default = false;
      }
    }
    const updated: ShopService = {
      ...row,
      name: input.name?.trim() || row.name,
      price_baht: input.priceBaht != null ? Math.round(input.priceBaht) : row.price_baht,
      is_default: input.isDefault ?? row.is_default,
      is_active: input.isActive ?? row.is_active,
      sort_order: input.sortOrder ?? row.sort_order,
      updated_at: nowIso(),
    };
    state.shopServices[idx] = updated;
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
        remindersEnabled: false,
        reminderLeadMinutes: 120,
        bookingConfirmPushEnabled: true,
      queueAheadPushEnabled: true,
      showFlexBrandFooter: true,
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
      remindersEnabled: input.remindersEnabled,
      reminderLeadMinutes: input.reminderLeadMinutes,
      bookingConfirmPushEnabled: input.bookingConfirmPushEnabled,
      queueAheadPushEnabled: input.queueAheadPushEnabled !== false,
      showFlexBrandFooter: input.showFlexBrandFooter !== false,
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
      if (!lineId) barber.line_display_name = null;
    }
    if (input.lineDisplayName !== undefined) {
      barber.line_display_name = input.lineDisplayName?.trim() || null;
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

  async updateShopBarberTier(shopId, tier) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    shop.barber_tier = tier;
    shop.updated_at = nowIso();
    return shop;
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
        barber_tier: "tier1",
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
        remindersEnabled: false,
        reminderLeadMinutes: 120,
        bookingConfirmPushEnabled: true,
      queueAheadPushEnabled: true,
      showFlexBrandFooter: true,
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
      barber_tier: "tier1",
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
      remindersEnabled: false,
      reminderLeadMinutes: 120,
      bookingConfirmPushEnabled: true,
      queueAheadPushEnabled: true,
      showFlexBrandFooter: true,
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

  async listShopManagers(shopId) {
    return getState()
      .shopManagers.filter((m) => m.shopId === shopId)
      .map((m) => ({ ...m }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async listManagerInvites(shopId) {
    return getState()
      .shopManagerInvites.filter((i) => i.shopId === shopId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createManagerInvite(shopId, createdByBarberId) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    const now = nowIso();
    const invite: ShopManagerInvite = {
      id: uuid(),
      shopId,
      role: "manager",
      token: inviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consumedAt: null,
      revokedAt: null,
      createdAt: now,
      createdByBarberId,
    };
    getState().shopManagerInvites.push(invite);
    return { ...invite };
  },

  async getManagerInvitePreview(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const invite = getState().shopManagerInvites.find((i) => i.token === trimmed);
    if (!invite) return null;
    const shop = getState().shops.find((s) => s.id === invite.shopId);
    const expired =
      !invite.consumedAt &&
      !invite.revokedAt &&
      new Date(invite.expiresAt).getTime() < Date.now();
    return {
      shopName: shop?.name ?? "",
      shopSlug: shop?.slug ?? "",
      expired,
      consumed: Boolean(invite.consumedAt),
      revoked: Boolean(invite.revokedAt),
    };
  },

  async claimManagerInvite(input) {
    const token = input.inviteToken.trim();
    const lineId = input.lineId.trim();
    if (!token || !lineId) throw new StoreConflict("INVALID_RANGE");

    const state = getState();
    const invite = state.shopManagerInvites.find((i) => i.token === token);
    if (!invite) throw new StoreConflict("INVITE_NOT_FOUND");
    if (invite.revokedAt) throw new StoreConflict("INVITE_REVOKED");
    if (invite.consumedAt) throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new StoreConflict("INVITE_EXPIRED");
    }

    const sameShop = state.shopManagers.find(
      (m) => m.shopId === invite.shopId && m.lineId === lineId && !m.revokedAt,
    );
    if (sameShop) throw new StoreConflict("MANAGER_ALREADY_ACTIVE");

    if (barbers.some((b) => b.line_id === lineId)) {
      throw new StoreConflict("IDENTITY_INCOMPATIBLE");
    }
    if (
      state.shopManagers.some(
        (m) => m.lineId === lineId && !m.revokedAt && m.shopId !== invite.shopId,
      )
    ) {
      throw new StoreConflict("IDENTITY_INCOMPATIBLE");
    }

    const now = nowIso();
    const manager: ShopManager = {
      id: uuid(),
      shopId: invite.shopId,
      lineId,
      role: "manager",
      displayName: input.displayName.trim() || "Manager",
      createdAt: now,
      revokedAt: null,
    };
    state.shopManagers.push(manager);
    invite.consumedAt = now;
    const shop = state.shops.find((s) => s.id === invite.shopId);
    return {
      shopId: invite.shopId,
      shopSlug: shop?.slug ?? "",
      managerId: manager.id,
    };
  },

  async regenerateManagerInvite(shopId, inviteId) {
    const state = getState();
    const invite = state.shopManagerInvites.find(
      (i) => i.id === inviteId && i.shopId === shopId,
    );
    if (!invite) throw new StoreConflict("INVITE_NOT_FOUND");
    if (invite.consumedAt) throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (invite.revokedAt) throw new StoreConflict("INVITE_REVOKED");

    const now = nowIso();
    invite.revokedAt = now;
    const next: ShopManagerInvite = {
      id: uuid(),
      shopId,
      role: "manager",
      token: inviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consumedAt: null,
      revokedAt: null,
      createdAt: now,
      createdByBarberId: invite.createdByBarberId,
    };
    state.shopManagerInvites.push(next);
    return { ...next };
  },

  async cancelManagerInvite(shopId, inviteId) {
    const invite = getState().shopManagerInvites.find(
      (i) => i.id === inviteId && i.shopId === shopId,
    );
    if (!invite) throw new StoreConflict("INVITE_NOT_FOUND");
    if (invite.consumedAt) throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (!invite.revokedAt) invite.revokedAt = nowIso();
    return { ...invite };
  },

  async revokeShopManager(shopId, managerId) {
    const manager = getState().shopManagers.find(
      (m) => m.id === managerId && m.shopId === shopId,
    );
    if (!manager) throw new StoreConflict("NOT_FOUND");
    if (!manager.revokedAt) manager.revokedAt = nowIso();
    return { ...manager };
  },

  async getActiveManagerByLineId(lineId) {
    const trimmed = lineId.trim();
    if (!trimmed) return null;
    const manager = getState().shopManagers.find(
      (m) => m.lineId === trimmed && !m.revokedAt,
    );
    return manager ? { ...manager } : null;
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
    barber.line_display_name = null;
    return { ...barber, off_days: [...barber.off_days] };
  },

  async createBarberLineInvite(shopId, barberId, createdByBarberId) {
    const shop = getState().shops.find((s) => s.id === shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    const barber = getBarberSync(barberId);
    if (!barber || barber.shop_id !== shopId || barber.is_active === false) {
      throw new StoreConflict("BARBER_NOT_FOUND");
    }
    const now = nowIso();
    const state = getState();
    for (const row of state.barberLineInvites) {
      if (
        row.barberId === barberId &&
        row.shopId === shopId &&
        !row.consumedAt &&
        !row.revokedAt
      ) {
        row.revokedAt = now;
      }
    }
    const invite: BarberLineInvite = {
      id: uuid(),
      shopId,
      barberId,
      token: inviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consumedAt: null,
      revokedAt: null,
      createdAt: now,
      createdByBarberId,
    };
    state.barberLineInvites.push(invite);
    return { ...invite };
  },

  async getPendingBarberLineInvite(shopId, barberId) {
    const now = Date.now();
    const pending = getState()
      .barberLineInvites.filter(
        (i) =>
          i.shopId === shopId &&
          i.barberId === barberId &&
          !i.consumedAt &&
          !i.revokedAt &&
          new Date(i.expiresAt).getTime() >= now,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return pending[0] ? { ...pending[0] } : null;
  },

  async getBarberLineInvitePreview(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const invite = getState().barberLineInvites.find((i) => i.token === trimmed);
    if (!invite) return null;
    const shop = getState().shops.find((s) => s.id === invite.shopId);
    const barber = getBarberSync(invite.barberId);
    const expired =
      !invite.consumedAt &&
      !invite.revokedAt &&
      new Date(invite.expiresAt).getTime() < Date.now();
    return {
      shopName: shop?.name ?? "",
      shopSlug: shop?.slug ?? "",
      barberName: barber?.name ?? "",
      expired,
      consumed: Boolean(invite.consumedAt),
      revoked: Boolean(invite.revokedAt),
    };
  },

  async claimBarberLineInvite(input) {
    const token = input.inviteToken.trim();
    const lineId = input.lineId.trim();
    if (!token || !lineId) throw new StoreConflict("INVALID_RANGE");

    const state = getState();
    const invite = state.barberLineInvites.find((i) => i.token === token);
    if (!invite) throw new StoreConflict("INVITE_NOT_FOUND");
    if (invite.revokedAt) throw new StoreConflict("INVITE_REVOKED");
    if (invite.consumedAt) throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new StoreConflict("INVITE_EXPIRED");
    }

    const barber = getBarberSync(invite.barberId);
    if (!barber || barber.shop_id !== invite.shopId || barber.is_active === false) {
      throw new StoreConflict("BARBER_NOT_FOUND");
    }

    const other = barbers.find((b) => b.line_id === lineId && b.id !== barber.id);
    if (other) throw new StoreConflict("LINE_ID_TAKEN");

    if (
      state.shopManagers.some((m) => m.lineId === lineId && !m.revokedAt)
    ) {
      throw new StoreConflict("IDENTITY_INCOMPATIBLE");
    }

    const now = nowIso();
    barber.line_id = lineId;
    barber.line_display_name = input.displayName.trim() || null;
    invite.consumedAt = now;
    for (const row of state.barberLineInvites) {
      if (
        row.barberId === barber.id &&
        row.id !== invite.id &&
        !row.consumedAt &&
        !row.revokedAt
      ) {
        row.revokedAt = now;
      }
    }
    const shop = state.shops.find((s) => s.id === invite.shopId);
    return {
      shopId: invite.shopId,
      shopSlug: shop?.slug ?? "",
      barberId: barber.id,
      barberName: barber.name,
    };
  },

  async cancelBarberLineInvite(shopId, barberId, inviteId) {
    const invite = getState().barberLineInvites.find(
      (i) => i.id === inviteId && i.shopId === shopId && i.barberId === barberId,
    );
    if (!invite) throw new StoreConflict("INVITE_NOT_FOUND");
    if (invite.consumedAt) throw new StoreConflict("INVITE_ALREADY_CLAIMED");
    if (!invite.revokedAt) invite.revokedAt = nowIso();
    return { ...invite };
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
      follow_up_at: null,
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
    return this.updateTrialLead(id, { status });
  },

  async updateTrialLead(
    id: string,
    patch: { status?: TrialLeadStatus; followUpAt?: string | null },
  ) {
    if (patch.status && !TRIAL_LEAD_STATUSES.includes(patch.status)) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const row = getState().trialLeads.find((r) => r.id === id);
    if (!row) throw new StoreConflict("NOT_FOUND");
    if (patch.status) row.status = patch.status;
    if (patch.followUpAt !== undefined) row.follow_up_at = patch.followUpAt;
    row.updated_at = nowIso();
    return { ...row };
  },

  async listTrialLeadNotes(leadId: string) {
    const exists = getState().trialLeads.some((r) => r.id === leadId);
    if (!exists) throw new StoreConflict("NOT_FOUND");
    return getState()
      .trialLeadNotes.filter((n) => n.trial_lead_id === leadId)
      .map((n) => ({ ...n }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async createTrialLeadNote(leadId: string, body: string) {
    const exists = getState().trialLeads.some((r) => r.id === leadId);
    if (!exists) throw new StoreConflict("NOT_FOUND");
    const row: TrialLeadNote = {
      id: uuid(),
      trial_lead_id: leadId,
      body,
      created_at: nowIso(),
    };
    getState().trialLeadNotes.push(row);
    return { ...row };
  },

  async createShopCancelFeedback(input: CreateShopCancelFeedbackInput) {
    const shop = getState().shops.find((s) => s.id === input.shopId);
    if (!shop) throw new StoreConflict("NOT_FOUND");
    const row: ShopCancelFeedback = {
      id: uuid(),
      shop_id: input.shopId,
      reason: input.reason,
      detail: input.detail?.trim() ? input.detail.trim() : null,
      bookable_count: input.bookableCount ?? null,
      recommended_tier: input.recommendedTier ?? null,
      created_by_barber_id: input.createdByBarberId ?? null,
      created_at: nowIso(),
    };
    getState().shopCancelFeedback.push(row);
    return { ...row };
  },

  async listShopCancelFeedback() {
    return [...getState().shopCancelFeedback]
      .map((r) => ({ ...r }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};
