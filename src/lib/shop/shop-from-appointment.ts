import { getStore } from "@/lib/data";
import type { Appointment, Shop } from "@/types/booking";

export async function resolveShopFromAppointment(
  appointment: Appointment,
): Promise<Shop | null> {
  const store = getStore();
  const barber = await store.getBarber(appointment.barber_id);
  if (!barber?.shop_id) return null;
  const shops = await store.listShops();
  return shops.find((s) => s.id === barber.shop_id) ?? null;
}
