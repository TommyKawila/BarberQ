import { getStore } from "@/lib/data";
import { buildShopRescheduleFlex } from "@/lib/line/flex-messages";
import { buildCustomerCancelUrl, buildShopCustomerUrl } from "@/lib/line/liff-url";
import { pushMessagesForShop } from "@/lib/line/push-message";
import type { Appointment, Shop } from "@/types/booking";

/** LINE push only when the booking has a LINE user — phone/chat/walk-in skip (no quota). */
export function shouldSendLineReschedulePush(
  appointment: Pick<Appointment, "customer_line_id">,
): boolean {
  return Boolean(appointment.customer_line_id?.trim());
}

/**
 * Shop-reschedule Flex CTA targets (ตกลง / เลือกเวลาอื่น).
 * Must be LIFF customer URLs — plain web `/bookings` opens LINE's in-app
 * browser, where useLineAuth auto-login never finishes → stuck "กำลังโหลด…".
 * There is no separate accept-reschedule API; both CTAs open My Bookings.
 */
export function shopRescheduleBookingsUrl(shopSlug: string): string {
  return buildShopCustomerUrl(shopSlug, "/bookings");
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
  const bookingsUrl = shopRescheduleBookingsUrl(shop.slug);
  const cancelUrl = after.cancel_token
    ? buildCustomerCancelUrl(after.cancel_token)
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
