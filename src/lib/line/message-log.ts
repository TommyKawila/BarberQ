import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";

export type LineMessageKind =
  | "reply_confirm"
  | "reply_ticket"
  | "push_cancel"
  | "push_reschedule"
  | "push_reminder"
  | "push_test"
  | "push_other";

export interface LineMessageLogInput {
  shopId: string;
  kind: LineMessageKind;
  counted: boolean;
  recipientLineId?: string | null;
  appointmentId?: string | null;
  success?: boolean;
  errorCode?: string | null;
}

interface LogRow {
  id: string;
  shopId: string;
  kind: LineMessageKind;
  counted: boolean;
  sentAt: string;
}

const memoryLogs: LogRow[] = [];
const memoryWebhookEvents = new Set<string>();

function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function recordLineMessage(input: LineMessageLogInput): Promise<void> {
  if (isPrototypeMode()) {
    memoryLogs.push({
      id: `log-${memoryLogs.length + 1}`,
      shopId: input.shopId,
      kind: input.kind,
      counted: input.counted,
      sentAt: new Date().toISOString(),
    });
    return;
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from("line_message_log").insert({
    shop_id: input.shopId,
    kind: input.kind,
    counted: input.counted,
    recipient_line_id: input.recipientLineId ?? null,
    appointment_id: input.appointmentId ?? null,
    success: input.success ?? true,
    error_code: input.errorCode ?? null,
  });
  if (error) {
    console.warn(JSON.stringify({ event: "line_message_log_failed", message: error.message }));
  }
}

export async function countCountedPushesThisMonth(shopId: string): Promise<number> {
  const since = monthStartIso();
  if (isPrototypeMode()) {
    return memoryLogs.filter(
      (row) => row.shopId === shopId && row.counted && row.sentAt >= since,
    ).length;
  }
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("line_message_log")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("counted", true)
    .gte("sent_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function claimWebhookEvent(
  shopId: string,
  webhookEventId: string,
): Promise<boolean> {
  if (!webhookEventId) return true;
  if (isPrototypeMode()) {
    const key = `${shopId}:${webhookEventId}`;
    if (memoryWebhookEvents.has(key)) return false;
    memoryWebhookEvents.add(key);
    return true;
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from("line_webhook_events").insert({
    webhook_event_id: webhookEventId,
    shop_id: shopId,
  });
  if (error) {
    if (error.code === "23505") return false;
    console.warn(JSON.stringify({ event: "webhook_dedupe_error", message: error.message }));
    return true;
  }
  return true;
}

export function __resetLineMessageLogForTests() {
  memoryLogs.length = 0;
  memoryWebhookEvents.clear();
}
