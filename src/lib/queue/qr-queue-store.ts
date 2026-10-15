import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type { JoinQrQueueInput, QrQueueEntry, QrQueueStatus } from "@/lib/queue/qr-queue-types";

const memoryEntries: QrQueueEntry[] = [];

function uuid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): QrQueueEntry {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    customer_line_id: String(row.customer_line_id),
    customer_name: String(row.customer_name),
    preferred_barber_id: (row.preferred_barber_id as string | null) ?? null,
    status: row.status as QrQueueStatus,
    appointment_id: (row.appointment_id as string | null) ?? null,
    assigned_barber_id: (row.assigned_barber_id as string | null) ?? null,
    ahead_notified_at: (row.ahead_notified_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function __resetQrQueueStoreForTests() {
  memoryEntries.length = 0;
}

export async function insertQrQueueEntry(input: JoinQrQueueInput): Promise<QrQueueEntry> {
  const preferred =
    input.preferredBarberId && input.preferredBarberId.trim()
      ? input.preferredBarberId.trim()
      : null;
  const name = input.customerName.trim() || "ลูกค้า";
  const lineId = input.customerLineId.trim();

  if (isPrototypeMode()) {
    const existing = memoryEntries.find(
      (e) =>
        e.shop_id === input.shopId &&
        e.customer_line_id === lineId &&
        e.status === "waiting",
    );
    if (existing) {
      const err = new Error("ALREADY_WAITING");
      (err as Error & { code: string }).code = "ALREADY_WAITING";
      throw err;
    }
    const row: QrQueueEntry = {
      id: uuid(),
      shop_id: input.shopId,
      customer_line_id: lineId,
      customer_name: name,
      preferred_barber_id: preferred,
      status: "waiting",
      appointment_id: null,
      assigned_barber_id: null,
      ahead_notified_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    memoryEntries.push(row);
    return row;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("qr_queue_entries")
    .insert({
      shop_id: input.shopId,
      customer_line_id: lineId,
      customer_name: name,
      preferred_barber_id: preferred,
      status: "waiting",
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      const err = new Error("ALREADY_WAITING");
      (err as Error & { code: string }).code = "ALREADY_WAITING";
      throw err;
    }
    throw new Error(error.message);
  }
  return mapRow(data as Record<string, unknown>);
}

export async function listWaitingQrQueue(shopId: string): Promise<QrQueueEntry[]> {
  if (isPrototypeMode()) {
    return memoryEntries
      .filter((e) => e.shop_id === shopId && e.status === "waiting")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("qr_queue_entries")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getQrQueueEntry(id: string): Promise<QrQueueEntry | null> {
  if (isPrototypeMode()) {
    return memoryEntries.find((e) => e.id === id) ?? null;
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("qr_queue_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getWaitingQrQueueForCustomer(
  shopId: string,
  customerLineId: string,
): Promise<QrQueueEntry | null> {
  const lineId = customerLineId.trim();
  if (isPrototypeMode()) {
    return (
      memoryEntries.find(
        (e) =>
          e.shop_id === shopId &&
          e.customer_line_id === lineId &&
          e.status === "waiting",
      ) ?? null
    );
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("qr_queue_entries")
    .select("*")
    .eq("shop_id", shopId)
    .eq("customer_line_id", lineId)
    .eq("status", "waiting")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function updateQrQueueEntry(
  id: string,
  patch: Partial<{
    status: QrQueueStatus;
    appointment_id: string | null;
    assigned_barber_id: string | null;
    ahead_notified_at: string | null;
    customer_name: string;
  }>,
): Promise<QrQueueEntry> {
  if (isPrototypeMode()) {
    const idx = memoryEntries.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("NOT_FOUND");
    const next = {
      ...memoryEntries[idx],
      ...patch,
      updated_at: nowIso(),
    };
    memoryEntries[idx] = next;
    return next;
  }
  const supabase = createServiceClient();
  const body: Record<string, unknown> = { updated_at: nowIso() };
  if ("status" in patch) body.status = patch.status;
  if ("appointment_id" in patch) body.appointment_id = patch.appointment_id;
  if ("assigned_barber_id" in patch) body.assigned_barber_id = patch.assigned_barber_id;
  if ("ahead_notified_at" in patch) body.ahead_notified_at = patch.ahead_notified_at;
  if ("customer_name" in patch) body.customer_name = patch.customer_name;
  const { data, error } = await supabase
    .from("qr_queue_entries")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function markQrQueueAheadNotified(id: string, at: Date = new Date()): Promise<void> {
  await updateQrQueueEntry(id, { ahead_notified_at: at.toISOString() });
}
