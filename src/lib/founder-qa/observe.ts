import { isLineAuthMockMode } from "@/lib/auth/line-verify";
import { isPrototypeMode } from "@/lib/data";
import { readBarberqEnv } from "@/lib/founder-qa/env";
import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import { parseAppHostname, parseSupabaseProjectRef } from "@/lib/founder-qa/parse";
import type { ObservedBarber, ObservedShop, ObservedTarget } from "@/lib/founder-qa/types";
import type { ShopHours } from "@/lib/shop/shop-hours";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ObserveOptions {
  env?: NodeJS.ProcessEnv;
  extraArgs?: string[];
  client?: SupabaseClient;
}

function mapShop(row: {
  id: string;
  name: string;
  slug: string;
  status: string;
} | null): ObservedShop | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
  };
}

function mapBarber(row: {
  id: string;
  name: string;
  role: string | null;
  shop_id: string | null;
  is_active: boolean | null;
  is_bookable: boolean | null;
  line_id: string | null;
  slot_duration_minutes: number | null;
  off_days: number[] | null;
}): ObservedBarber {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "barber",
    shopId: row.shop_id ?? "",
    isActive: row.is_active !== false,
    isBookable: row.is_bookable !== false,
    lineLinked: Boolean(row.line_id),
    slotDuration: row.slot_duration_minutes ?? 30,
    offDays: row.off_days ?? [],
  };
}

export async function observeFounderQa(
  options: ObserveOptions = {},
): Promise<ObservedTarget> {
  const env = options.env ?? process.env;
  const extraArgs = options.extraArgs ?? [];
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const usingMemoryStore = isPrototypeMode();
  const usingLineMock = isLineAuthMockMode();
  const base: ObservedTarget = {
    barberqEnv: readBarberqEnv(env),
    supabaseProjectRef: parseSupabaseProjectRef(supabaseUrl),
    appHostname: parseAppHostname(env.NEXT_PUBLIC_APP_URL),
    extraArgs,
    supabaseConnected: false,
    managerSchemaPresent: false,
    usingMemoryStore,
    usingLineMock,
    liffConfigured: Boolean(env.NEXT_PUBLIC_LIFF_ID?.trim()),
    shop: null,
    sentinel: null,
    barbers: [],
    sentinelBarbers: [],
    activeManagerCount: 0,
    pendingInviteCount: 0,
    appointmentCount: 0,
    hours: null,
  };

  if (!supabaseUrl || !serviceKey) return base;

  const client =
    options.client ??
    createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  const shopId = FOUNDER_QA_MANIFEST.shop.id;
  const sentinelId = FOUNDER_QA_MANIFEST.sentinel.id;

  const { data: shop, error: shopError } = await client
    .from("shops")
    .select("id,name,slug,status")
    .eq("id", shopId)
    .maybeSingle();
  if (shopError) return base;
  base.supabaseConnected = true;
  base.shop = mapShop(shop);

  const { data: sentinel } = await client
    .from("shops")
    .select("id,name,slug,status")
    .eq("id", sentinelId)
    .maybeSingle();
  base.sentinel = mapShop(sentinel);

  const { data: barbers } = await client
    .from("barbers")
    .select(
      "id,name,role,shop_id,is_active,is_bookable,line_id,slot_duration_minutes,off_days",
    )
    .in("shop_id", [shopId, sentinelId]);
  const mapped = (barbers ?? []).map(mapBarber);
  base.barbers = mapped.filter((b) => b.shopId === shopId);
  base.sentinelBarbers = mapped.filter((b) => b.shopId === sentinelId);

  const { error: managerError, count: managerCount } = await client
    .from("shop_managers")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .is("revoked_at", null);
  if (!managerError) {
    base.managerSchemaPresent = true;
    base.activeManagerCount = managerCount ?? 0;
  }

  const { count: inviteCount } = await client
    .from("shop_manager_invites")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .is("consumed_at", null)
    .is("revoked_at", null);
  base.pendingInviteCount = inviteCount ?? 0;

  const barberIds = base.barbers.map((b) => b.id);
  if (barberIds.length > 0) {
    const { count: aptCount } = await client
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("barber_id", barberIds);
    base.appointmentCount = aptCount ?? 0;
  }

  const { data: settings } = await client
    .from("shop_settings")
    .select("hours")
    .eq("shop_id", shopId)
    .maybeSingle();
  base.hours = (settings?.hours as ShopHours | null) ?? null;

  return base;
}
