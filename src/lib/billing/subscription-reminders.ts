import { getStore } from "@/lib/data";
import { calendarDaysUntil, computePlanState } from "@/lib/billing/plan-state";
import { getPaymentStore } from "@/lib/billing/payment-store";
import { pushTextForShop } from "@/lib/line/push-message";

const REMINDER_DAYS = [7, 3, 0] as const;

export type SubscriptionReminderResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

function reminderCopy(daysBefore: 0 | 3 | 7, shopName: string): string {
  if (daysBefore === 7) {
    return `ร้าน ${shopName}: แพ็กเกจจะหมดอายุในอีก 7 วัน\nต่ออายุได้ที่เมนู Admin → Billing`;
  }
  if (daysBefore === 3) {
    return `ร้าน ${shopName}: แพ็กเกจจะหมดอายุในอีก 3 วัน\nกรุณาต่ออายุที่ Admin → Billing`;
  }
  return `ร้าน ${shopName}: แพ็กเกจหมดอายุวันนี้\nมีเวลาผ่อนผัน 3 วัน — ต่ออายุที่ Admin → Billing`;
}

/**
 * Daily cron companion: remind owners at 7 / 3 / 0 days before subscribed_until.
 */
export async function processSubscriptionReminders(
  now: Date = new Date(),
): Promise<SubscriptionReminderResult> {
  const store = getStore();
  const payments = getPaymentStore();
  const shops = await store.listShops();
  const result: SubscriptionReminderResult = { scanned: 0, sent: 0, skipped: 0 };

  for (const shop of shops) {
    if (shop.is_demo) continue;
    if (!shop.subscribed_until) continue;
    const plan = computePlanState(shop, now);
    if (plan.state === "expired") continue;

    const until = new Date(shop.subscribed_until);
    const days = calendarDaysUntil(until, now);
    if (!(REMINDER_DAYS as readonly number[]).includes(days)) continue;

    result.scanned += 1;
    const daysBefore = days as 0 | 3 | 7;
    const claimed = await payments.claimSubscriptionReminder(
      shop.id,
      shop.subscribed_until,
      daysBefore,
    );
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    const owners = (await store.listBarbersByShop(shop.id)).filter(
      (b) => b.role === "owner" && b.line_id,
    );
    if (owners.length === 0) {
      result.skipped += 1;
      continue;
    }

    let anySent = false;
    for (const owner of owners) {
      const push = await pushTextForShop(
        shop.id,
        owner.line_id!,
        reminderCopy(daysBefore, shop.name),
        "push_other",
      );
      if (push.sent) anySent = true;
    }
    if (anySent) result.sent += 1;
    else result.skipped += 1;
  }

  return result;
}
