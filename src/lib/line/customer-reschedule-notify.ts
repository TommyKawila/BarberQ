import { getStore } from "@/lib/data";
import { buildCustomerRescheduleTicketFlex } from "@/lib/line/flex-messages";
import {
  buildCustomerCancelUrl,
  buildShopBookingsCustomerUrl,
} from "@/lib/line/liff-url";
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
  const store = getStore();
  const fresh = (await store.getAppointment(after.id)) ?? after;
  const lineId =
    fresh.customer_line_id?.trim() ||
    after.customer_line_id?.trim() ||
    before.customer_line_id?.trim() ||
    "";
  if (!shouldSendCustomerRescheduleTicket({ ...fresh, customer_line_id: lineId })) {
    return { sent: false, skippedReason: "invalid_input" };
  }

  const settings = await store.getShopSettings(shop.id);
  if (!settings.bookingConfirmPushEnabled) {
    return { sent: false, skippedReason: "disabled" };
  }

  if (await hasSuccessfulCustomerRescheduleTicket(shop.id, fresh.id)) {
    return { sent: false, skippedReason: "already_delivered" };
  }

  const barber = await store.getBarber(fresh.barber_id);
  const myBookingsUrl = buildShopBookingsCustomerUrl(shop.slug);
  const cancelUrl = fresh.cancel_token
    ? buildCustomerCancelUrl(fresh.cancel_token)
    : null;

  let barberName = barber?.name ?? "—";
  if (before.barber_id !== fresh.barber_id) {
    const oldBarber = await store.getBarber(before.barber_id);
    if (oldBarber?.name && barber?.name && oldBarber.name !== barber.name) {
      barberName = `${oldBarber.name} → ${barber.name}`;
    }
  }

  const flex = buildCustomerRescheduleTicketFlex({
    shopName: shop.name,
    oldStartTime: before.start_time,
    oldEndTime: before.end_time,
    newStartTime: fresh.start_time,
    newEndTime: fresh.end_time,
    barberName,
    myBookingsUrl,
    cancelUrl,
    showBrandFooter: settings.showFlexBrandFooter !== false,
  });

  return pushMessagesForShop(
    shop.id,
    lineId,
    [flex],
    "push_reschedule_ticket",
    fresh.id,
  );
}
