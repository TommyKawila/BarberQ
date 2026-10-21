import { getStore } from "@/lib/data";
import type { Shop } from "@/types/booking";
import { BookingError } from "@/lib/services/booking-service";
import {
  computePlanState,
  isShopOperationalStatus,
} from "@/lib/billing/plan-state";

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  return getStore().getShopBySlug(slug);
}

export async function getActiveShopBySlug(slug: string): Promise<Shop> {
  const shop = await getShopBySlug(slug);
  if (!shop) {
    throw new BookingError("SHOP_NOT_FOUND", "Shop not found", 404);
  }
  if (!isShopOperationalStatus(shop.status)) {
    throw new BookingError("SHOP_INACTIVE", "Shop is not active", 403);
  }
  const plan = computePlanState(shop);
  if (!plan.canBook) {
    throw new BookingError(
      "SHOP_SUBSCRIPTION_EXPIRED",
      "Shop subscription has expired",
      403,
    );
  }
  return shop;
}
