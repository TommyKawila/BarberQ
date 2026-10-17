import { getStore } from "@/lib/data";
import { buildCustomerRescheduleTicketFlex } from "@/lib/line/flex-messages";
import { buildCustomerCancelUrl, buildShopCustomerUrl } from "@/lib/line/liff-url";
import { hasSuccessfulCustomerRescheduleTicket } from "@/lib/line/message-log";
import { pushMessagesForShop, type PushResult } from "@/lib/line/push-message";
import type { Appointment, Shop } from "@/types/booking";

/** Customer self-reschedule ticket: needs LINE id + confirmed booking. */
export function shouldSendCustomerRescheduleTicket(
  appointment: Pick<Appointment, "customer_line_id" | "status">,
): boolean {
  if (appointment.status !== "confirmed") return false;
  return Boolean(appointment.customer_line_id?.trim());
}

/**
 * Push a queue ticket after customer self-reschedule.
 * Gates on shop setting bookingConfirmPushEnabled (same as booking confirm).
 * Idempotent via push_reschedule_ticket log; counts toward 300 monthly quota.
 */
export async function notifyCustomerSelfRescheduleTicket(
  shop: Shop,
  before: Appointment,
  after: Appointment,
): Promise<PushResult> {
  if (!shouldSendCustomerRescheduleTicket(after)) {
    return { sent: false, skippedReason: "invalid_input" };
  }
  const lineId = after.customer_line_id!.trim();

  const settings = await getStore().getShopSettings(shop.id);
  if (!settings.bookingConfirmPushEnabled) {
    return { sent: false, skippedReason: "disabled" };
  }

  if (await hasSuccessfulCustomerRescheduleTicket(shop.id, after.id)) {
    return { sent: false, skippedReason: "already_delivered" };
  }

  const store = getStore();
  const barber = await store.getBarber(after.barber_id);
  const myBookingsUrl = buildShopCustomerUrl(shop.slug, "/bookings");
  const cancelUrl = after.cancel_token
    ? buildCustomerCancelUrl(after.cancel_token)
    : myBookingsUrl;

  const flex = buildCustomerRescheduleTicketFlex({
    shopName: shop.name,
    oldStartTime: before.start_time,
    oldEndTime: before.end_time,
    newStartTime: after.start_time,
    newEndTime: after.end_time,
    barberName: barber?.name ?? "—",
    myBookingsUrl,
    cancelUrl,
  });

  return pushMessagesForShop(
    shop.id,
    lineId,
    [flex],
    "push_reschedule_ticket",
    after.id,
  );
}
