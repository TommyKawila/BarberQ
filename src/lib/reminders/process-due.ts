import { getShopPushQuota } from "@/lib/line/quota";
import {
  claimReminderSend,
  listDueReminders,
  releaseReminderClaim,
  type DueReminderRow,
} from "@/lib/reminders/reminder-store";
import {
  sendAppointmentReminderPush,
  shouldSendAppointmentReminder,
} from "@/lib/reminders/send-reminder";
import { notifyStaffWebPush } from "@/lib/webpush/notify";
import type { Shop } from "@/types/booking";

export type ReminderProcessResult = {
  scanned: number;
  sent: number;
  skipped: number;
  quotaSkipped: number;
  errors: number;
};

/**
 * Scan due reminders and send at most one LINE push per booking.
 * Idempotent via reminder_sent_at claim. Quota skips are logged and claimed
 * (no retry storm); transient API failures release the claim.
 */
export async function processDueReminders(
  now: Date = new Date(),
): Promise<ReminderProcessResult> {
  const due = await listDueReminders(now);
  const result: ReminderProcessResult = {
    scanned: due.length,
    sent: 0,
    skipped: 0,
    quotaSkipped: 0,
    errors: 0,
  };

  const quotaNotifiedShops = new Set<string>();

  for (const row of due) {
    await processOne(row, now, result, quotaNotifiedShops);
  }
  return result;
}

function shopFromRow(row: DueReminderRow): Shop {
  return {
    id: row.shop_id,
    name: row.shop_name,
    slug: row.shop_slug,
    status: "active",
    subscribed_until: null,
    created_at: row.start_time,
    updated_at: row.start_time,
  };
}

async function processOne(
  row: DueReminderRow,
  now: Date,
  result: ReminderProcessResult,
  quotaNotifiedShops: Set<string>,
): Promise<void> {
  if (!shouldSendAppointmentReminder(row)) {
    const claimed = await claimReminderSend(row.id, now);
    if (claimed) result.skipped += 1;
    return;
  }

  const claimed = await claimReminderSend(row.id, now);
  if (!claimed) {
    result.skipped += 1;
    return;
  }

  try {
    const shop = shopFromRow(row);
    const push = await sendAppointmentReminderPush(shop, row);
    if (push.sent) {
      result.sent += 1;
      return;
    }

    if (push.skippedReason === "quota_full") {
      result.quotaSkipped += 1;
      console.warn(
        JSON.stringify({
          event: "appointment_reminder_skipped",
          reason: "quota_full",
          shopId: row.shop_id,
          appointmentId: row.id,
        }),
      );
      if (!quotaNotifiedShops.has(row.shop_id)) {
        quotaNotifiedShops.add(row.shop_id);
        await notifyOwnerQuotaFull(shop, row).catch(() => {});
      }
      return;
    }

    if (push.skippedReason === "api_error") {
      await releaseReminderClaim(row.id);
      result.errors += 1;
      return;
    }

    // missing_token / invalid_input — claim kept so we don't retry forever
    result.skipped += 1;
  } catch (err) {
    await releaseReminderClaim(row.id).catch(() => {});
    result.errors += 1;
    console.warn(
      JSON.stringify({
        event: "appointment_reminder_error",
        appointmentId: row.id,
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
  }
}

async function notifyOwnerQuotaFull(shop: Shop, row: DueReminderRow): Promise<void> {
  const quota = await getShopPushQuota(shop.id);
  if (quota.canPush) return;

  await notifyStaffWebPush({
    shopId: shop.id,
    shopSlug: shop.slug,
    shopName: shop.name,
    appointment: {
      id: row.id,
      barber_id: row.barber_id,
      customer_ref: null,
      customer_name: row.customer_name,
      customer_phone: null,
      start_time: row.start_time,
      end_time: row.end_time,
      status: "confirmed",
      created_at: row.start_time,
      customer_line_id: row.customer_line_id,
      source: "line",
    },
    event: "line_quota_full",
  });
}
