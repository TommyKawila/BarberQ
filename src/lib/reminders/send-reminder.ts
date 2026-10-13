import { getStore } from "@/lib/data";
import { buildAppointmentReminderFlex } from "@/lib/line/flex-messages";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import { pushMessagesForShop, type PushResult } from "@/lib/line/push-message";
import type { DueReminderRow } from "@/lib/reminders/reminder-store";
import type { Shop } from "@/types/booking";

export function shouldSendAppointmentReminder(
  row: Pick<DueReminderRow, "source" | "customer_line_id" | "status">,
): boolean {
  if (row.status !== "confirmed") return false;
  if (row.source !== "line") return false;
  return Boolean(row.customer_line_id?.trim());
}

export async function sendAppointmentReminderPush(
  shop: Shop,
  row: DueReminderRow,
): Promise<PushResult> {
  if (!shouldSendAppointmentReminder(row)) {
    return { sent: false, skippedReason: "invalid_input" };
  }

  const store = getStore();
  const barber = await store.getBarber(row.barber_id);
  const myBookingsUrl = `${buildShopWebUrl(shop.slug)}/bookings`;

  const flex = buildAppointmentReminderFlex({
    shopName: shop.name,
    startTime: row.start_time,
    endTime: row.end_time,
    barberName: barber?.name ?? "—",
    myBookingsUrl,
  });

  return pushMessagesForShop(
    shop.id,
    row.customer_line_id.trim(),
    [flex],
    "push_reminder",
    row.id,
  );
}
