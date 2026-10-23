import { isPrototypeMode } from "@/lib/data";
import type { BillingReminderKind } from "@/lib/billing/due-date";
import { createServiceClient } from "@/lib/supabase/server";

export interface BillingReminderClaim {
  shopId: string;
  kind: BillingReminderKind;
  dueAtKey: string;
  recipientLineId: string;
}

/** In-memory claims for prototype / unit tests. */
const memoryClaims = new Set<string>();

function claimKey(input: BillingReminderClaim): string {
  return `${input.shopId}|${input.kind}|${input.dueAtKey}`;
}

export function __resetBillingReminderLogForTests() {
  memoryClaims.clear();
}

/**
 * Atomically claim a reminder send. Returns true if this caller owns the send
 * (first claim wins). False = already sent for this shop/kind/due cycle.
 */
export async function claimBillingReminderSend(
  input: BillingReminderClaim,
): Promise<boolean> {
  const key = claimKey(input);
  if (isPrototypeMode()) {
    if (memoryClaims.has(key)) return false;
    memoryClaims.add(key);
    return true;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("shop_billing_reminder_log").insert({
    shop_id: input.shopId,
    reminder_kind: input.kind,
    due_at: input.dueAtKey,
    recipient_line_id: input.recipientLineId,
  });

  if (!error) return true;
  // Unique violation → already claimed
  if (error.code === "23505") return false;
  console.error(
    JSON.stringify({
      event: "billing_reminder_claim_failed",
      shopId: input.shopId,
      kind: input.kind,
      message: error.message,
    }),
  );
  return false;
}
