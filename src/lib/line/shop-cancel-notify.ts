import { getStore } from "@/lib/data";
import { buildShopCancelFlex } from "@/lib/line/flex-messages";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import { pushMessagesForShop } from "@/lib/line/push-message";
import type { Appointment, Shop } from "@/types/booking";

export async function notifyCustomerShopCancel(
  shop: Shop,
  appointment: Appointment,
  reason?: string | null,
): Promise<void> {
  const lineId = appointment.customer_line_id?.trim();
  if (!lineId) return;

  const store = getStore();
  const barber = await store.getBarber(appointment.barber_id);
  const settings = await store.getShopSettings(shop.id);
  const bookUrl = buildShopWebUrl(shop.slug);
  const callUrl = settings.phone ? `tel:${settings.phone}` : null;

  const flex = buildShopCancelFlex({
    shopName: shop.name,
    startTime: appointment.start_time,
    barberName: barber?.name ?? "—",
    reason: reason ?? null,
    bookUrl,
    callUrl,
  });

  await pushMessagesForShop(
    shop.id,
    lineId,
    [flex],
    "push_cancel",
    appointment.id,
  );
}
