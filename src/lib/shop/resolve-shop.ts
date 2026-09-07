import { getStore } from "@/lib/data";
import type { Shop } from "@/types/booking";
import { BookingError } from "@/lib/services/booking-service";

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  return getStore().getShopBySlug(slug);
}

export async function getActiveShopBySlug(slug: string): Promise<Shop> {
  const shop = await getShopBySlug(slug);
  if (!shop) {
    throw new BookingError("SHOP_NOT_FOUND", "Shop not found", 404);
  }
  if (shop.status !== "active") {
    throw new BookingError("SHOP_INACTIVE", "Shop is not active", 403);
  }
  return shop;
}
