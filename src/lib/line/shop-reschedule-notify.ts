import { getStore } from "@/lib/data";
import { buildShopRescheduleFlex } from "@/lib/line/flex-messages";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import { pushMessagesForShop } from "@/lib/line/push-message";
import type { Appointment, Shop } from "@/types/booking";

/** LINE push only when the booking has a LINE user — phone/chat/walk-in skip (no quota). */
export function shouldSendLineReschedulePush(
  appointment: Pick<Appointment, "customer_line_id">,
): boolean {
  return Boolean(appointment.customer_line_id?.trim());
}

export async function notifyCustomerShopReschedule(
  shop: Shop,
  before: Appointment,
  after: Appointment,
  reason?: string | null,
): Promise<void> {
  if (!shouldSendLineReschedulePush(after)) return;
  const lineId = after.customer_line_id!.trim();

  const store = getStore();
  const barber = await store.getBarber(after.barber_id);
  const bookingsUrl = `${buildShopWebUrl(shop.slug)}/bookings`;
  const cancelUrl = after.cancel_token
    ? `${buildShopWebUrl(shop.slug)}/c/${after.cancel_token}`
    : bookingsUrl;

  const flex = buildShopRescheduleFlex({
    shopName: shop.name,
    oldStartTime: before.start_time,
    newStartTime: after.start_time,
    barberName: barber?.name ?? "—",
    reason: reason ?? null,
    acceptUrl: bookingsUrl,
    pickUrl: bookingsUrl,
    cancelUrl,
  });

  await pushMessagesForShop(
    shop.id,
    lineId,
    [flex],
    "push_reschedule",
    after.id,
  );
}
