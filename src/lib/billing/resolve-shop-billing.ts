import { getShopBySlug } from "@/lib/shop/resolve-shop";
import { isShopOperationalStatus } from "@/lib/billing/plan-state";
import { BookingError } from "@/lib/services/booking-service";
import type { Shop } from "@/types/booking";

/** Admin/billing: allow trialing/active even when subscription expired. */
export async function getShopForAdminBilling(slug: string): Promise<Shop> {
  const shop = await getShopBySlug(slug);
  if (!shop) {
    throw new BookingError("SHOP_NOT_FOUND", "Shop not found", 404);
  }
  if (!isShopOperationalStatus(shop.status) && shop.status !== "pending") {
    throw new BookingError("SHOP_INACTIVE", "Shop is not active", 403);
  }
  return shop;
}
