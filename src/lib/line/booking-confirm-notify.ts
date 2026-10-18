import { getStore } from "@/lib/data";
import {
  buildBookingConfirmFlex,
  buildQueueTicketFlex,
} from "@/lib/line/flex-messages";
import { buildCustomerCancelUrl, buildShopCustomerUrl } from "@/lib/line/liff-url";
import { hasSuccessfulBookingConfirm } from "@/lib/line/message-log";
import { pushMessagesForShop, type PushResult } from "@/lib/line/push-message";
import type { Appointment, Shop } from "@/types/booking";

export type BookingConfirmFlexPair = {
  confirm: ReturnType<typeof buildBookingConfirmFlex>;
  ticket: ReturnType<typeof buildQueueTicketFlex>;
  myBookingsUrl: string;
  cancelUrl: string;
};

/** Shared Flex pair for reply (webhook) and push fallback. */
export async function buildBookingConfirmFlexPair(
  shop: Pick<Shop, "id" | "slug" | "name">,
  appointment: Appointment,
): Promise<BookingConfirmFlexPair | null> {
  if (appointment.status !== "confirmed") return null;

  const store = getStore();
  const barber = await store.getBarber(appointment.barber_id);
  const myBookingsUrl = buildShopCustomerUrl(shop.slug, "/bookings");
  const cancelUrl = appointment.cancel_token
    ? buildCustomerCancelUrl(appointment.cancel_token)
    : myBookingsUrl;

  const dayStart = new Date(appointment.start_time);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayAppts = (await store.listDayAppointments(dayStart, dayEnd)).filter(
    (a) => a.status === "confirmed" && a.barber_id === appointment.barber_id,
  );
  dayAppts.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const index = dayAppts.findIndex((a) => a.id === appointment.id);
  const ahead = Math.max(0, index);
  const queueLabel = `Q-${String(index + 1).padStart(2, "0")}`;
  const waitMinutes = ahead * (barber?.slot_duration_minutes ?? 30);

  return {
    confirm: buildBookingConfirmFlex({
      shopName: shop.name,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      barberName: barber?.name ?? "—",
      appointmentId: appointment.id,
      myBookingsUrl,
      cancelUrl,
    }),
    ticket: buildQueueTicketFlex({
      shopName: shop.name,
      queueLabel,
      aheadCount: ahead,
      waitMinutes,
      liveUrl: myBookingsUrl,
    }),
    myBookingsUrl,
    cancelUrl,
  };
}

/** LINE confirm push only for LINE-linked customers (same gate as shop-cancel). */
export function shouldSendLineBookingConfirmPush(
  appointment: Pick<Appointment, "customer_line_id" | "source" | "status">,
): boolean {
  if (appointment.status !== "confirmed") return false;
  if (appointment.source && appointment.source !== "line") return false;
  return Boolean(appointment.customer_line_id?.trim());
}

/**
 * Push confirmation + queue ticket via the same Messaging API path as shop-cancel.
 * Both Flex messages are sent in ONE push API call (1 quota count).
 * Idempotent: skips if reply_confirm or push_confirm already succeeded.
 * Respects shop setting bookingConfirmPushEnabled (default ON).
 * Counts toward the shop's 300 monthly push quota when sent.
 */
export async function pushBookingConfirmFallback(
  shop: Shop,
  appointment: Appointment,
): Promise<PushResult> {
  if (!shouldSendLineBookingConfirmPush(appointment)) {
    return { sent: false, skippedReason: "invalid_input" };
  }
  const lineId = appointment.customer_line_id!.trim();

  const settings = await getStore().getShopSettings(shop.id);
  if (!settings.bookingConfirmPushEnabled) {
    return { sent: false, skippedReason: "disabled" };
  }

  if (await hasSuccessfulBookingConfirm(shop.id, appointment.id)) {
    return { sent: false, skippedReason: "already_delivered" };
  }

  const pair = await buildBookingConfirmFlexPair(shop, appointment);
  if (!pair) {
    return { sent: false, skippedReason: "invalid_input" };
  }

  // One Messaging API push with multiple messages = 1 monthly quota count.
  return pushMessagesForShop(
    shop.id,
    lineId,
    [pair.confirm, pair.ticket],
    "push_confirm",
    appointment.id,
  );
}

/** Server-side notify after booking commit (mirrors notifyCustomerShopCancel). */
export async function notifyCustomerBookingConfirm(
  shop: Shop,
  appointment: Appointment,
): Promise<PushResult> {
  return pushBookingConfirmFallback(shop, appointment);
}
