import { getStore } from "@/lib/data";
import { getStaffFromLineId, type ShopStaffRole } from "@/lib/admin-auth";

export type OwnerShopSummary = {
  id: string;
  slug: string;
  name: string;
  role: ShopStaffRole;
};

/**
 * Shops the LINE user can open in admin.
 * Today the schema is 0–1 shop per LINE id; returns an array for UI pickers.
 */
export async function listOwnerShopsForLineId(
  lineId: string,
): Promise<OwnerShopSummary[]> {
  if (!lineId) return [];
  const staff = await getStaffFromLineId(lineId);
  if (!staff) return [];
  const shops = await getStore().listShops();
  const shop = shops.find((s) => s.id === staff.shopId);
  if (!shop) return [];
  return [
    {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      role: staff.role,
    },
  ];
}
