import { getStore } from "@/lib/data";
import type { Shop } from "@/types/booking";
import { getDemoShopSlug } from "@/lib/marketing/demo-shop";

export function shopIsDemo(shop: Pick<Shop, "is_demo" | "slug"> | null | undefined): boolean {
  if (!shop) return false;
  if (shop.is_demo === true) return true;
  return shop.slug === getDemoShopSlug();
}

export async function findDemoShop(): Promise<Shop | null> {
  const slug = getDemoShopSlug();
  const shop = await getStore().getShopBySlug(slug);
  if (!shop || shop.status !== "active") return null;
  return shop;
}

export async function isDemoShopId(shopId: string): Promise<boolean> {
  if (!shopId) return false;
  const shops = await getStore().listShops();
  const shop = shops.find((s) => s.id === shopId);
  return shopIsDemo(shop);
}
