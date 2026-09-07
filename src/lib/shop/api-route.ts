import { getActiveShopBySlug } from "@/lib/shop/resolve-shop";
import type { Shop } from "@/types/booking";

export async function resolveShopParam(shopSlug: string): Promise<Shop> {
  return getActiveShopBySlug(shopSlug);
}
