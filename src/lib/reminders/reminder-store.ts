import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type { Appointment } from "@/types/booking";
import type { ReminderLeadMinutes } from "@/lib/reminders/presets";

export interface ReminderSchedulePatch {
  leadMinutes: ReminderLeadMinutes | null;
  dueAt: Date | null;
  /** When true, clear sent_at so a new reminder can fire (reschedule). */
  clearSentAt?: boolean;
}

export interface DueReminderRow {
  id: string;
  shop_id: string;
  shop_slug: string;
  shop_name: string;
  barber_id: string;
  customer_name: string;
  customer_line_id: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  reminder_lead_minutes: number | null;
  reminder_due_at: string;
  reminder_sent_at: string | null;
}

/** In-memory appointments mirror for prototype/tests — keyed by appointment id. */
const memoryReminderMeta = new Map<
  string,
  {
    shopId: string;
    shopSlug: string;
    shopName: string;
    leadMinutes: number | null;
    dueAt: string | null;
    sentAt: string | null;
    status: string;
    source: string;
    customerLineId: string | null;
    barberId: string;
    customerName: string;
    startTime: string;
    endTime: string;
  }
>();

export function __resetReminderStoreForTests() {
  memoryReminderMeta.clear();
}

export function __seedReminderForTests(row: DueReminderRow) {
  memoryReminderMeta.set(row.id, {
    shopId: row.shop_id,
    shopSlug: row.shop_slug,
    shopName: row.shop_name,
    leadMinutes: row.reminder_lead_minutes,
    dueAt: row.reminder_due_at,
    sentAt: row.reminder_sent_at,
    status: row.status,
    source: row.source,
    customerLineId: row.customer_line_id,
    barberId: row.barber_id,
    customerName: row.customer_name,
    startTime: row.start_time,
    endTime: row.end_time,
  });
}

export async function patchAppointmentReminder(
  appointmentId: string,
  shopId: string,
  appointment: Pick<
    Appointment,
    | "barber_id"
    | "customer_name"
    | "customer_line_id"
    | "start_time"
    | "end_time"
    | "status"
    | "source"
  >,
  patch: ReminderSchedulePatch,
): Promise<void> {
  const dueAtIso = patch.dueAt?.toISOString() ?? null;
  const sentAtClear = patch.clearSentAt === true;

  if (isPrototypeMode()) {
    const prev = memoryReminderMeta.get(appointmentId);
    memoryReminderMeta.set(appointmentId, {
      shopId,
      shopSlug: prev?.shopSlug ?? "shop",
      shopName: prev?.shopName ?? "Shop",
      leadMinutes: patch.leadMinutes,
      dueAt: dueAtIso,
      sentAt: sentAtClear ? null : (prev?.sentAt ?? null),
      status: appointment.status,
      source: appointment.source ?? "line",
      customerLineId: appointment.customer_line_id ?? null,
      barberId: appointment.barber_id,
      customerName: appointment.customer_name,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
    });
    return;
  }

  const supabase = createServiceClient();
  const update: Record<string, unknown> = {
    reminder_lead_minutes: patch.leadMinutes,
    reminder_due_at: dueAtIso,
  };
  if (sentAtClear) update.reminder_sent_at = null;

  const { error } = await supabase
    .from("appointments")
    .update(update)
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);
}

export async function listDueReminders(now: Date = new Date(), limit = 50): Promise<DueReminderRow[]> {
  const nowIso = now.toISOString();

  if (isPrototypeMode()) {
    const rows: DueReminderRow[] = [];
    for (const [id, meta] of memoryReminderMeta) {
      if (meta.sentAt) continue;
      if (!meta.dueAt || meta.dueAt > nowIso) continue;
      if (meta.status !== "confirmed") continue;
      if (meta.source !== "line") continue;
      if (!meta.customerLineId?.trim()) continue;
      rows.push({
        id,
        shop_id: meta.shopId,
        shop_slug: meta.shopSlug,
        shop_name: meta.shopName,
        barber_id: meta.barberId,
        customer_name: meta.customerName,
        customer_line_id: meta.customerLineId,
        start_time: meta.startTime,
        end_time: meta.endTime,
        status: meta.status,
        source: meta.source,
        reminder_lead_minutes: meta.leadMinutes,
        reminder_due_at: meta.dueAt,
        reminder_sent_at: meta.sentAt,
      });
    }
    return rows.slice(0, limit);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, barber_id, customer_name, customer_line_id, start_time, end_time, status, source, reminder_lead_minutes, reminder_due_at, reminder_sent_at, barbers!inner(shop_id, shops!inner(id, slug, name))",
    )
    .eq("status", "confirmed")
    .eq("source", "line")
    .is("reminder_sent_at", null)
    .not("reminder_due_at", "is", null)
    .lte("reminder_due_at", nowIso)
    .not("customer_line_id", "is", null)
    .order("reminder_due_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const barbers = row.barbers as
        | { shop_id: string; shops: { id: string; slug: string; name: string } }
        | { shop_id: string; shops: { id: string; slug: string; name: string } }[]
        | null;
      const barber = Array.isArray(barbers) ? barbers[0] : barbers;
      const shop = barber?.shops;
      return {
        id: row.id as string,
        shop_id: shop?.id ?? barber?.shop_id ?? "",
        shop_slug: shop?.slug ?? "",
        shop_name: shop?.name ?? "",
        barber_id: row.barber_id as string,
        customer_name: row.customer_name as string,
        customer_line_id: (row.customer_line_id as string) ?? "",
        start_time: row.start_time as string,
        end_time: row.end_time as string,
        status: row.status as string,
        source: (row.source as string) ?? "line",
        reminder_lead_minutes: (row.reminder_lead_minutes as number | null) ?? null,
        reminder_due_at: row.reminder_due_at as string,
        reminder_sent_at: (row.reminder_sent_at as string | null) ?? null,
      };
    })
    .filter((r) => r.shop_id && r.shop_slug && r.customer_line_id.trim());
}

/**
 * Atomically claim a reminder send (sets sent_at). Returns true if this caller won the claim.
 * Safe under concurrent cron retries — only one claim succeeds.
 */
export async function claimReminderSend(
  appointmentId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const nowIso = now.toISOString();

  if (isPrototypeMode()) {
    const meta = memoryReminderMeta.get(appointmentId);
    if (!meta || meta.sentAt || meta.status !== "confirmed") return false;
    if (!meta.dueAt || meta.dueAt > nowIso) return false;
    meta.sentAt = nowIso;
    return true;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ reminder_sent_at: nowIso })
    .eq("id", appointmentId)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .not("reminder_due_at", "is", null)
    .lte("reminder_due_at", nowIso)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

/** Clear claim so a transient API failure can retry on the next cron tick. */
export async function releaseReminderClaim(appointmentId: string): Promise<void> {
  if (isPrototypeMode()) {
    const meta = memoryReminderMeta.get(appointmentId);
    if (meta) meta.sentAt = null;
    return;
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("appointments")
    .update({ reminder_sent_at: null })
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);
}

export function getMemoryReminderSentAt(appointmentId: string): string | null {
  return memoryReminderMeta.get(appointmentId)?.sentAt ?? null;
}
