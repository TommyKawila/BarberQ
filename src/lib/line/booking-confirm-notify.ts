import { getStore } from "@/lib/data";
import {
  buildBookingConfirmFlex,
  buildQueueTicketFlex,
} from "@/lib/line/flex-messages";
import { buildShopCustomerUrl } from "@/lib/line/liff-url";
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
    ? buildShopCustomerUrl(shop.slug, `/c/${appointment.cancel_token}`)
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

/**
 * Push confirmation + queue ticket when liff.sendMessages is unavailable/fails.
 * Counts toward the shop's 300 monthly push quota.
 */
export async function pushBookingConfirmFallback(
  shop: Shop,
  appointment: Appointment,
): Promise<PushResult> {
  const lineId = appointment.customer_line_id?.trim();
  if (!lineId || appointment.source !== "line") {
    return { sent: false, skippedReason: "invalid_input" };
  }

  if (await hasSuccessfulBookingConfirm(shop.id, appointment.id)) {
    return { sent: false, skippedReason: "already_delivered" };
  }

  const pair = await buildBookingConfirmFlexPair(shop, appointment);
  if (!pair) {
    return { sent: false, skippedReason: "invalid_input" };
  }

  return pushMessagesForShop(
    shop.id,
    lineId,
    [pair.confirm, pair.ticket],
    "push_confirm",
    appointment.id,
  );
}
