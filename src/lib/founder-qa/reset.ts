import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { evaluateGuards } from "@/lib/founder-qa/guards";
import { FOUNDER_QA_HOURS, FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import { ordinaryBarberFixtures } from "@/lib/founder-qa/fixtures";
import { observeFounderQa } from "@/lib/founder-qa/observe";
import { printSafe } from "@/lib/founder-qa/output";
import { evaluateVerify } from "@/lib/founder-qa/verify";
import type { ObservedTarget } from "@/lib/founder-qa/types";

const SHOP_ID = FOUNDER_QA_MANIFEST.shop.id;

type QaDb = {
  from: (table: string) => {
    select: (columns: string, options?: object) => QaFilter;
    delete: () => QaFilter;
    upsert: (values: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
    update: (values: Record<string, unknown>) => QaFilter;
  };
};

type QaFilter = PromiseLike<{
  data?: Array<Record<string, unknown>> | null;
  error: { message: string } | null;
}> & {
  eq: (column: string, value: unknown) => QaFilter;
  neq: (column: string, value: unknown) => QaFilter;
  in: (column: string, values: string[]) => QaFilter;
  maybeSingle?: () => PromiseLike<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
};

function clientFromEnv(): QaDb {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("missing-supabase");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as QaDb;
}

async function qaBarberIds(supabase: QaDb): Promise<string[]> {
  const { data } = await supabase.from("barbers").select("id").eq("shop_id", SHOP_ID);
  return (data ?? []).map((row) => String(row.id));
}

async function clearOperational(supabase: QaDb, barberIds: string[]): Promise<void> {
  if (barberIds.length > 0) {
    const { error: aptErr } = await supabase.from("appointments").delete().in("barber_id", barberIds);
    if (aptErr) throw aptErr;
    const { error: blockErr } = await supabase.from("blocked_slots").delete().in("barber_id", barberIds);
    if (blockErr) throw blockErr;
    const { error: breakErr } = await supabase.from("recurring_breaks").delete().in("barber_id", barberIds);
    if (breakErr) throw breakErr;
  }
  const { error: mgrErr } = await supabase.from("shop_managers").delete().eq("shop_id", SHOP_ID);
  if (mgrErr) throw mgrErr;
  const { error: invErr } = await supabase.from("shop_manager_invites").delete().eq("shop_id", SHOP_ID);
  if (invErr) throw invErr;
}

async function restoreOrdinaryBarbers(supabase: QaDb): Promise<void> {
  const keep: string[] = ordinaryBarberFixtures().map((b) => b.id);
  const { data: extras } = await supabase
    .from("barbers")
    .select("id,role")
    .eq("shop_id", SHOP_ID)
    .neq("role", "owner");
  const extraIds = (extras ?? [])
    .map((row) => String(row.id))
    .filter((id) => !keep.includes(id));
  if (extraIds.length > 0) {
    await supabase.from("appointments").delete().in("barber_id", extraIds);
    await supabase.from("blocked_slots").delete().in("barber_id", extraIds);
    await supabase.from("recurring_breaks").delete().in("barber_id", extraIds);
    const { error } = await supabase.from("barbers").delete().in("id", extraIds);
    if (error) throw error;
  }
  for (const fixture of ordinaryBarberFixtures()) {
    const { error } = await supabase.from("barbers").upsert({
      id: fixture.id,
      shop_id: SHOP_ID,
      name: fixture.name,
      role: "barber",
      slot_duration_minutes: fixture.slotDuration,
      off_days: [],
      is_bookable: true,
      is_active: true,
      line_id: null,
    });
    if (error) throw error;
  }
  const { error: hoursErr } = await supabase.from("shop_settings").upsert({
    shop_id: SHOP_ID,
    shop_name: FOUNDER_QA_MANIFEST.shop.name,
    hours: FOUNDER_QA_HOURS,
    shop_line_url: null,
    shop_phone: null,
    cover_image_url: null,
  });
  if (hoursErr) throw hoursErr;
}

async function mutateDaily(): Promise<void> {
  const supabase = clientFromEnv();
  const ids = await qaBarberIds(supabase);
  await clearOperational(supabase, ids);
  await restoreOrdinaryBarbers(supabase);
  const { error } = await supabase
    .from("shops")
    .update({ status: "active" })
    .eq("id", SHOP_ID)
    .eq("slug", FOUNDER_QA_MANIFEST.shop.slug)
    .eq("name", FOUNDER_QA_MANIFEST.shop.name);
  if (error) throw error;
}

async function mutateOwnerClaim(): Promise<void> {
  const supabase = clientFromEnv();
  const ids = await qaBarberIds(supabase);
  await clearOperational(supabase, ids);
  await restoreOrdinaryBarbers(supabase);
  const { error: unlinkErr } = await supabase
    .from("barbers")
    .update({ line_id: null })
    .eq("shop_id", SHOP_ID)
    .eq("role", "owner");
  if (unlinkErr) throw unlinkErr;
  const token = randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: shopErr } = await supabase
    .from("shops")
    .update({
      status: "pending",
      invite_token: token,
      invite_expires_at: expires,
    })
    .eq("id", SHOP_ID)
    .eq("slug", FOUNDER_QA_MANIFEST.shop.slug)
    .eq("name", FOUNDER_QA_MANIFEST.shop.name);
  if (shopErr) throw shopErr;
  void token;
}

function failNotReady(message: string): number {
  printSafe(["Founder QA environment: NOT READY", message].join("\n"));
  return 1;
}

export async function runDailyReset(observed: ObservedTarget): Promise<number> {
  const live = await observeFounderQa({ extraArgs: observed.extraArgs });
  const guards = evaluateGuards(live);
  if (!guards.ok) {
    printSafe("Founder QA reset: refused\nNo data was changed.");
    return 1;
  }
  try {
    await mutateDaily();
  } catch {
    return failNotReady("Reset did not complete successfully. Run qa:verify.");
  }
  const after = await observeFounderQa({ extraArgs: [] });
  const verify = evaluateVerify(after, FOUNDER_QA_MANIFEST, "daily");
  if (!verify.ok) {
    return failNotReady("Post-reset verification: FAIL");
  }
  printSafe(
    [
      "Founder QA reset: PASS",
      "BarberQ Pilot Test restored to daily baseline",
      "Post-reset verification: PASS",
    ].join("\n"),
  );
  return 0;
}

export async function runOwnerClaimReset(
  observed: ObservedTarget,
): Promise<number> {
  const live = await observeFounderQa({ extraArgs: observed.extraArgs });
  const guards = evaluateGuards(live);
  if (!guards.ok) {
    printSafe("Founder QA Owner-claim reset: refused\nNo data was changed.");
    return 1;
  }
  try {
    await mutateOwnerClaim();
  } catch {
    return failNotReady("Owner-claim reset did not complete successfully. Run qa:verify.");
  }
  const after = await observeFounderQa({ extraArgs: [] });
  const verify = evaluateVerify(after, FOUNDER_QA_MANIFEST, "owner-claim");
  if (!verify.ok) {
    return failNotReady("Post-reset verification: FAIL");
  }
  printSafe(
    [
      "Founder QA Owner-claim reset: PASS",
      "BarberQ Pilot Test prepared for Owner claim (BC)",
      "Post-reset verification: PASS",
      "Copy the Owner invite once from Super Admin on the QA host. Do not use daily qa:reset for this scenario.",
    ].join("\n"),
  );
  return 0;
}
