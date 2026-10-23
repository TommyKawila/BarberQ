import { getStore } from "@/lib/data";
import { buildAppointmentReminderFlex } from "@/lib/line/flex-messages";
import {
  buildCustomerCancelUrl,
  buildShopBookingsCustomerUrl,
} from "@/lib/line/liff-url";
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

/** Same cancel URL the booking-confirm Flex uses (global /c/{token}). */
export function reminderCancelUrl(
  cancelToken: string | null | undefined,
): string | null {
  const token = cancelToken?.trim();
  return token ? buildCustomerCancelUrl(token) : null;
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
  const appointment = await store.getAppointment(row.id);
  const settings = await store.getShopSettings(shop.id);
  const myBookingsUrl = buildShopBookingsCustomerUrl(shop.slug);
  // Same cancel_token link as booking confirm; builder hides link when <60 min.
  const cancelUrl = reminderCancelUrl(appointment?.cancel_token);

  const flex = buildAppointmentReminderFlex({
    shopName: shop.name,
    startTime: row.start_time,
    endTime: row.end_time,
    barberName: barber?.name ?? "—",
    myBookingsUrl,
    cancelUrl,
    showBrandFooter: settings.showFlexBrandFooter !== false,
  });

  return pushMessagesForShop(
    shop.id,
    row.customer_line_id.trim(),
    [flex],
    "push_reminder",
    row.id,
  );
}
