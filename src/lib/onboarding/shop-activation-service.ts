import { getStore } from "@/lib/data";
import { deriveShopActivation, type ShopActivation } from "@/lib/onboarding/activation";
import type { Shop } from "@/types/booking";

async function countShopAppointments(shopId: string): Promise<number> {
  const store = getStore();
  const barbers = await store.listBarbersByShop(shopId);
  const barberIds = new Set(barbers.map((b) => b.id));
  const appointments = await store.listAppointmentsInRange(
    new Date(0),
    new Date("2099-12-31T23:59:59Z"),
  );
  return appointments.filter(
    (a) => barberIds.has(a.barber_id) && a.status !== "cancelled",
  ).length;
}

export async function getShopActivation(shop: Shop): Promise<ShopActivation> {
  const store = getStore();
  const [settings, barbers, appointmentCount] = await Promise.all([
    store.getShopSettings(shop.id),
    store.listBarbersByShop(shop.id),
    countShopAppointments(shop.id),
  ]);
  return deriveShopActivation({
    shopStatus: shop.status,
    shopName: settings.shopName,
    hours: settings.hours,
    barbers,
    appointmentCount,
  });
}

export interface ShopActivationSummary extends ShopActivation {
  shopId: string;
  slug: string;
}

export async function getShopActivationSummary(shop: Shop): Promise<ShopActivationSummary> {
  const activation = await getShopActivation(shop);
  return { ...activation, shopId: shop.id, slug: shop.slug };
}
