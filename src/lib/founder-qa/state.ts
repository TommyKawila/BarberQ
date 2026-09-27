import { ordinaryBarberFixtures } from "@/lib/founder-qa/fixtures";
import { FOUNDER_QA_HOURS, FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import type { ObservedBarber, ObservedShop, ObservedTarget } from "@/lib/founder-qa/types";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { BarberqEnv } from "@/lib/founder-qa/env";

export interface QaBarberRow {
  id: string;
  shopId: string;
  name: string;
  role: "owner" | "barber";
  lineLinked: boolean;
  isActive: boolean;
  isBookable: boolean;
  slotDuration: number;
  offDays: number[];
}

export interface QaState {
  shops: ObservedShop[];
  barbers: QaBarberRow[];
  managers: { id: string; shopId: string; revoked: boolean }[];
  invites: { id: string; shopId: string; pending: boolean }[];
  appointments: { id: string; barberId: string }[];
  blocks: { id: string; barberId: string }[];
  breaks: { id: string; barberId: string }[];
  hoursByShop: Record<string, ShopHours>;
  logs: string[];
  ownerInvitePrepared?: boolean;
}

const SHOP_ID = FOUNDER_QA_MANIFEST.shop.id;
const SENTINEL_ID = FOUNDER_QA_MANIFEST.sentinel.id;

function cloneHours(hours: ShopHours): ShopHours {
  return hours.map((d) => ({ ...d }));
}

function cloneState(state: QaState): QaState {
  return JSON.parse(JSON.stringify(state)) as QaState;
}

function qaBarberIds(state: QaState): string[] {
  return state.barbers.filter((b) => b.shopId === SHOP_ID).map((b) => b.id);
}

function restoreOrdinary(state: QaState): void {
  const keep = new Set<string>([
    ...ordinaryBarberFixtures().map((b) => b.id),
    ...state.barbers.filter((b) => b.shopId === SHOP_ID && b.role === "owner").map((b) => b.id),
  ]);
  state.barbers = state.barbers.filter(
    (b) => b.shopId !== SHOP_ID || keep.has(b.id),
  );
  for (const fixture of ordinaryBarberFixtures()) {
    const existing = state.barbers.find((b) => b.id === fixture.id);
    const row: QaBarberRow = {
      id: fixture.id,
      shopId: SHOP_ID,
      name: fixture.name,
      role: "barber",
      lineLinked: false,
      isActive: true,
      isBookable: true,
      slotDuration: fixture.slotDuration,
      offDays: [],
    };
    if (existing) Object.assign(existing, row);
    else state.barbers.push(row);
  }
  state.hoursByShop[SHOP_ID] = cloneHours(FOUNDER_QA_HOURS);
}

function clearQaOps(state: QaState): void {
  const ids = new Set(qaBarberIds(state));
  state.appointments = state.appointments.filter((a) => !ids.has(a.barberId));
  state.blocks = state.blocks.filter((a) => !ids.has(a.barberId));
  state.breaks = state.breaks.filter((a) => !ids.has(a.barberId));
  state.managers = state.managers.filter((m) => m.shopId !== SHOP_ID);
  state.invites = state.invites.filter((m) => m.shopId !== SHOP_ID);
}

export function applyDailyReset(input: QaState): QaState {
  const state = cloneState(input);
  clearQaOps(state);
  restoreOrdinary(state);
  const shop = state.shops.find((s) => s.id === SHOP_ID);
  if (shop) shop.status = "active";
  state.logs.push("daily-reset");
  return state;
}

export function applyOwnerClaimReset(input: QaState): QaState {
  const state = cloneState(input);
  clearQaOps(state);
  restoreOrdinary(state);
  for (const barber of state.barbers) {
    if (barber.shopId === SHOP_ID && barber.role === "owner") {
      barber.lineLinked = false;
    }
  }
  const shop = state.shops.find((s) => s.id === SHOP_ID);
  if (shop) shop.status = "pending";
  state.ownerInvitePrepared = true;
  state.logs.push("owner-claim-reset");
  return state;
}

export function stateToObserved(
  state: QaState,
  env: BarberqEnv = "founder_qa",
): ObservedTarget {
  const shop = state.shops.find((s) => s.id === SHOP_ID) ?? null;
  const sentinel = state.shops.find((s) => s.id === SENTINEL_ID) ?? null;
  const mapBarber = (b: QaBarberRow): ObservedBarber => ({
    id: b.id,
    name: b.name,
    role: b.role,
    shopId: b.shopId,
    isActive: b.isActive,
    isBookable: b.isBookable,
    lineLinked: b.lineLinked,
    slotDuration: b.slotDuration,
    offDays: b.offDays,
  });
  const qaBarbers = state.barbers.filter((b) => b.shopId === SHOP_ID);
  const ids = new Set(qaBarbers.map((b) => b.id));
  return {
    barberqEnv: env,
    supabaseProjectRef: FOUNDER_QA_MANIFEST.qaSupabaseProjectRef,
    appHostname: FOUNDER_QA_MANIFEST.qaAppHostname,
    extraArgs: [],
    supabaseConnected: true,
    managerSchemaPresent: true,
    usingMemoryStore: false,
    usingLineMock: false,
    liffConfigured: true,
    shop,
    sentinel,
    barbers: qaBarbers.map(mapBarber),
    sentinelBarbers: state.barbers.filter((b) => b.shopId === SENTINEL_ID).map(mapBarber),
    activeManagerCount: state.managers.filter((m) => m.shopId === SHOP_ID && !m.revoked).length,
    pendingInviteCount: state.invites.filter((m) => m.shopId === SHOP_ID && m.pending).length,
    appointmentCount: state.appointments.filter((a) => ids.has(a.barberId)).length,
    hours: state.hoursByShop[SHOP_ID] ?? null,
  };
}

export function seedDirtyState(): QaState {
  return {
    shops: [
      { ...FOUNDER_QA_MANIFEST.shop, status: "active" },
      { ...FOUNDER_QA_MANIFEST.sentinel, status: "active" },
    ],
    barbers: [
      {
        id: "owner-row",
        shopId: SHOP_ID,
        name: "Founder Owner",
        role: "owner",
        lineLinked: true,
        isActive: true,
        isBookable: false,
        slotDuration: 30,
        offDays: [],
      },
      {
        id: "extra-barber",
        shopId: SHOP_ID,
        name: "Temp",
        role: "barber",
        lineLinked: false,
        isActive: true,
        isBookable: true,
        slotDuration: 45,
        offDays: [1],
      },
      {
        id: FOUNDER_QA_MANIFEST.sentinelBarber.id,
        shopId: SENTINEL_ID,
        name: FOUNDER_QA_MANIFEST.sentinelBarber.name,
        role: "barber",
        lineLinked: true,
        isActive: true,
        isBookable: true,
        slotDuration: 30,
        offDays: [],
      },
    ],
    managers: [{ id: "mgr-1", shopId: SHOP_ID, revoked: false }],
    invites: [{ id: "inv-1", shopId: SHOP_ID, pending: true }],
    appointments: [
      { id: "apt-1", barberId: "extra-barber" },
      { id: "apt-s", barberId: FOUNDER_QA_MANIFEST.sentinelBarber.id },
    ],
    blocks: [{ id: "blk-1", barberId: "extra-barber" }],
    breaks: [{ id: "brk-1", barberId: "extra-barber" }],
    hoursByShop: {
      [SHOP_ID]: [{ closed: true, open: "00:00", close: "00:00" }],
      [SENTINEL_ID]: cloneHours(FOUNDER_QA_HOURS),
    },
    logs: [],
  };
}
