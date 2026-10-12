import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type { ShopStaffRole } from "@/lib/admin-auth";

export type BarberWebpushScope = "own" | "all";

export interface WebPushSubscriptionRow {
  id: string;
  shopId: string;
  staffKey: string;
  staffRole: ShopStaffRole;
  barberId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  deviceLabel: string | null;
  notifyNewBooking: boolean;
  notifyCancel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertWebPushSubscriptionInput {
  staffKey: string;
  staffRole: ShopStaffRole;
  barberId?: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  deviceLabel?: string | null;
  notifyNewBooking?: boolean;
  notifyCancel?: boolean;
}

const memorySubs: WebPushSubscriptionRow[] = [];
const memoryScopes = new Map<string, BarberWebpushScope>();

function mapRow(row: Record<string, unknown>): WebPushSubscriptionRow {
  return {
    id: String(row.id),
    shopId: String(row.shop_id),
    staffKey: String(row.staff_key),
    staffRole: row.staff_role as ShopStaffRole,
    barberId: (row.barber_id as string | null) ?? null,
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    userAgent: (row.user_agent as string | null) ?? null,
    deviceLabel: (row.device_label as string | null) ?? null,
    notifyNewBooking: Boolean(row.notify_new_booking ?? true),
    notifyCancel: Boolean(row.notify_cancel ?? true),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertWebPushSubscription(
  shopId: string,
  input: UpsertWebPushSubscriptionInput,
): Promise<WebPushSubscriptionRow> {
  if (isPrototypeMode()) {
    const existing = memorySubs.findIndex(
      (s) => s.shopId === shopId && s.endpoint === input.endpoint,
    );
    const now = new Date().toISOString();
    const row: WebPushSubscriptionRow = {
      id: existing >= 0 ? memorySubs[existing].id : `wps-${memorySubs.length + 1}`,
      shopId,
      staffKey: input.staffKey,
      staffRole: input.staffRole,
      barberId: input.barberId ?? null,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
      deviceLabel: input.deviceLabel ?? null,
      notifyNewBooking: input.notifyNewBooking ?? true,
      notifyCancel: input.notifyCancel ?? true,
      createdAt: existing >= 0 ? memorySubs[existing].createdAt : now,
      updatedAt: now,
    };
    if (existing >= 0) memorySubs[existing] = row;
    else memorySubs.push(row);
    return row;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .upsert(
      {
        shop_id: shopId,
        staff_key: input.staffKey,
        staff_role: input.staffRole,
        barber_id: input.barberId ?? null,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent ?? null,
        device_label: input.deviceLabel ?? null,
        notify_new_booking: input.notifyNewBooking ?? true,
        notify_cancel: input.notifyCancel ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id,endpoint" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function updateWebPushPreferences(
  shopId: string,
  staffKey: string,
  endpoint: string,
  prefs: { notifyNewBooking?: boolean; notifyCancel?: boolean },
): Promise<WebPushSubscriptionRow | null> {
  if (isPrototypeMode()) {
    const row = memorySubs.find(
      (s) => s.shopId === shopId && s.staffKey === staffKey && s.endpoint === endpoint,
    );
    if (!row) return null;
    if (prefs.notifyNewBooking !== undefined) row.notifyNewBooking = prefs.notifyNewBooking;
    if (prefs.notifyCancel !== undefined) row.notifyCancel = prefs.notifyCancel;
    row.updatedAt = new Date().toISOString();
    return row;
  }
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (prefs.notifyNewBooking !== undefined) patch.notify_new_booking = prefs.notifyNewBooking;
  if (prefs.notifyCancel !== undefined) patch.notify_cancel = prefs.notifyCancel;
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .update(patch)
    .eq("shop_id", shopId)
    .eq("staff_key", staffKey)
    .eq("endpoint", endpoint)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function deleteWebPushSubscription(
  shopId: string,
  endpoint: string,
): Promise<void> {
  if (isPrototypeMode()) {
    const idx = memorySubs.findIndex((s) => s.shopId === shopId && s.endpoint === endpoint);
    if (idx >= 0) memorySubs.splice(idx, 1);
    return;
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("web_push_subscriptions")
    .delete()
    .eq("shop_id", shopId)
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function listWebPushSubscriptions(
  shopId: string,
): Promise<WebPushSubscriptionRow[]> {
  if (isPrototypeMode()) {
    return memorySubs.filter((s) => s.shopId === shopId);
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .select("*")
    .eq("shop_id", shopId);
  if (error) throw new Error(error.message);
  return ((data as Record<string, unknown>[]) ?? []).map(mapRow);
}

export async function getStaffWebPushSubscription(
  shopId: string,
  staffKey: string,
  endpoint?: string,
): Promise<WebPushSubscriptionRow | null> {
  const rows = await listWebPushSubscriptions(shopId);
  const filtered = rows.filter((r) => r.staffKey === staffKey);
  if (endpoint) return filtered.find((r) => r.endpoint === endpoint) ?? null;
  return filtered[0] ?? null;
}

export async function getBarberWebpushScope(shopId: string): Promise<BarberWebpushScope> {
  if (isPrototypeMode()) return memoryScopes.get(shopId) ?? "own";
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_settings")
    .select("barber_webpush_scope")
    .eq("shop_id", shopId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const scope = data?.barber_webpush_scope as BarberWebpushScope | undefined;
  return scope === "all" ? "all" : "own";
}

export async function setBarberWebpushScope(
  shopId: string,
  scope: BarberWebpushScope,
): Promise<BarberWebpushScope> {
  if (isPrototypeMode()) {
    memoryScopes.set(shopId, scope);
    return scope;
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shop_settings")
    .upsert(
      { shop_id: shopId, barber_webpush_scope: scope },
      { onConflict: "shop_id" },
    );
  if (error) throw new Error(error.message);
  return scope;
}

export function __resetWebPushForTests() {
  memorySubs.length = 0;
  memoryScopes.clear();
}
