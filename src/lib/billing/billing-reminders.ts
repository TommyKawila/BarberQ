import {
  billingDueDateKey,
  graceDaysRemaining,
  resolveBillingReminderKind,
  type BillingReminderKind,
} from "@/lib/billing/due-date";
import { claimBillingReminderSend } from "@/lib/billing/reminder-log";
import { getStore } from "@/lib/data";
import { pushText } from "@/lib/line/push-message";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import type { Barber, Shop } from "@/types/booking";

export type BillingReminderProcessResult = {
  scanned: number;
  eligible: number;
  sent: number;
  skipped: number;
  errors: number;
};

export function billingPageUrl(shopSlug: string): string {
  return buildShopWebUrl(shopSlug, "/admin/settings/billing");
}

/** Thai owner copy — no automatic-charge wording. */
export function buildBillingReminderText(
  kind: BillingReminderKind,
  shopName: string,
  billingUrl: string,
  graceDaysLeft?: number,
): string {
  const name = shopName.trim() || "ร้านของคุณ";
  if (kind === "day25") {
    return (
      `ClipperQ · ร้าน${name}\n` +
      `ใกล้ครบกำหนดชำระแล้ว (อีก 5 วัน)\n` +
      `ชำระผ่าน QR PromptPay ได้ที่\n${billingUrl}\n` +
      `ไม่มีการตัดบัตรอัตโนมัติ`
    );
  }
  if (kind === "due") {
    return (
      `ClipperQ · ร้าน${name}\n` +
      `วันนี้ครบกำหนดชำระค่าบริการแล้วครับ\n` +
      `ชำระผ่าน QR PromptPay ได้ที่\n${billingUrl}\n` +
      `ไม่มีการตัดบัตรอัตโนมัติ · ยังใช้ระบบได้ตามปกติ`
    );
  }
  const left =
    graceDaysLeft != null && graceDaysLeft > 0
      ? ` · ผ่อนผันเหลือ ${graceDaysLeft} วัน`
      : "";
  return (
    `ClipperQ · ร้าน${name}\n` +
    `เลยกำหนดชำระมา 3 วันแล้วครับ${left}\n` +
    `ชำระผ่าน QR PromptPay ได้ที่\n${billingUrl}\n` +
    `ไม่มีการตัดบัตรอัตโนมัติ`
  );
}

function ownerLineId(barbers: Barber[]): string | null {
  const owner = barbers.find((b) => b.role === "owner" && b.line_id?.trim());
  return owner?.line_id?.trim() ?? null;
}

async function processOneShop(
  shop: Shop,
  now: Date,
  result: BillingReminderProcessResult,
): Promise<void> {
  if (shop.is_demo) {
    result.skipped += 1;
    return;
  }
  if (shop.status === "cancelled" || shop.status === "suspended") {
    result.skipped += 1;
    return;
  }

  const kind = resolveBillingReminderKind(shop, now);
  if (!kind) {
    result.skipped += 1;
    return;
  }
  result.eligible += 1;

  const store = getStore();
  const barbers = await store.listBarbersByShop(shop.id);
  const lineId = ownerLineId(barbers);
  if (!lineId) {
    result.skipped += 1;
    console.warn(
      JSON.stringify({
        event: "billing_reminder_skipped",
        reason: "no_owner_line_id",
        shopId: shop.id,
        kind,
      }),
    );
    return;
  }

  const dueAtKey = billingDueDateKey(shop, now);
  const claimed = await claimBillingReminderSend({
    shopId: shop.id,
    kind,
    dueAtKey,
    recipientLineId: lineId,
  });
  if (!claimed) {
    result.skipped += 1;
    return;
  }

  const url = billingPageUrl(shop.slug);
  const text = buildBillingReminderText(
    kind,
    shop.name,
    url,
    kind === "overdue3" ? graceDaysRemaining(shop, now) : undefined,
  );

  try {
    const ok = await pushText(lineId, text);
    if (ok) {
      result.sent += 1;
      console.info(
        JSON.stringify({
          event: "billing_reminder_sent",
          shopId: shop.id,
          kind,
          dueAtKey,
        }),
      );
    } else {
      result.errors += 1;
      console.warn(
        JSON.stringify({
          event: "billing_reminder_push_failed",
          shopId: shop.id,
          kind,
        }),
      );
    }
  } catch (err) {
    result.errors += 1;
    console.error(
      JSON.stringify({
        event: "billing_reminder_error",
        shopId: shop.id,
        kind,
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
  }
}

/**
 * Scan shops and push ClipperQ-OA billing reminders to OWNER only.
 * Idempotent via shop_billing_reminder_log. Reuses cron `/api/cron/reminders`.
 */
export async function processBillingReminders(
  now: Date = new Date(),
): Promise<BillingReminderProcessResult> {
  const shops = await getStore().listShops();
  const result: BillingReminderProcessResult = {
    scanned: shops.length,
    eligible: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  for (const shop of shops) {
    await processOneShop(shop, now, result);
  }
  return result;
}
