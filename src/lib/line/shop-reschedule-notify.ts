import { getStore } from "@/lib/data";
import { buildShopRescheduleFlex } from "@/lib/line/flex-messages";
import {
  buildCustomerCancelUrl,
  buildShopBookingsCustomerUrl,
} from "@/lib/line/liff-url";
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
  return buildShopBookingsCustomerUrl(shopSlug);
}

export async function notifyCustomerShopReschedule(
  shop: Shop,
  before: Appointment,
  after: Appointment,
  reason?: string | null,
): Promise<void> {
  // Prefer after; fall back to before when RPC payload omits LINE id (seen on
  // cross-barber moves when the returned row is incomplete).
  const lineId =
    after.customer_line_id?.trim() || before.customer_line_id?.trim() || "";
  if (!lineId) return;

  const store = getStore();
  // Re-fetch so barber_id / cancel_token are canonical after a barber change.
  const fresh = (await store.getAppointment(after.id)) ?? after;
  const barber = await store.getBarber(fresh.barber_id);
  const settings = await store.getShopSettings(shop.id);
  const bookingsUrl = shopRescheduleBookingsUrl(shop.slug);
  const cancelUrl = fresh.cancel_token
    ? buildCustomerCancelUrl(fresh.cancel_token)
    : bookingsUrl;

  let barberName = barber?.name ?? "—";
  if (before.barber_id !== fresh.barber_id) {
    const oldBarber = await store.getBarber(before.barber_id);
    if (oldBarber?.name && barber?.name && oldBarber.name !== barber.name) {
      barberName = `${oldBarber.name} → ${barber.name}`;
    }
  }

  const flex = buildShopRescheduleFlex({
    shopName: shop.name,
    oldStartTime: before.start_time,
    newStartTime: fresh.start_time,
    barberName,
    reason: reason ?? null,
    acceptUrl: bookingsUrl,
    pickUrl: bookingsUrl,
    cancelUrl,
    showBrandFooter: settings.showFlexBrandFooter !== false,
  });

  await pushMessagesForShop(
    shop.id,
    lineId,
    [flex],
    "push_reschedule",
    fresh.id,
  );
}
