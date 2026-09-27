import type { ShopHours } from "@/lib/shop/shop-hours";
import type { BarberqEnv } from "@/lib/founder-qa/env";

export interface ObservedShop {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface ObservedBarber {
  id: string;
  name: string;
  role: string;
  shopId: string;
  isActive: boolean;
  isBookable: boolean;
  lineLinked: boolean;
  slotDuration: number;
  offDays: number[];
}

export interface ObservedTarget {
  barberqEnv: BarberqEnv | "missing" | "unknown";
  supabaseProjectRef: string | null;
  appHostname: string | null;
  extraArgs: string[];
  supabaseConnected: boolean;
  managerSchemaPresent: boolean;
  usingMemoryStore: boolean;
  usingLineMock: boolean;
  liffConfigured: boolean;
  shop: ObservedShop | null;
  sentinel: ObservedShop | null;
  barbers: ObservedBarber[];
  sentinelBarbers: ObservedBarber[];
  activeManagerCount: number;
  pendingInviteCount: number;
  appointmentCount: number;
  hours: ShopHours | null;
}

export interface QaCheck {
  id: string;
  pass: boolean;
  message: string;
}

export interface QaVerifyResult {
  ok: boolean;
  checks: QaCheck[];
}

export interface QaGuardResult {
  ok: boolean;
  mutated: false;
  checks: QaCheck[];
}
