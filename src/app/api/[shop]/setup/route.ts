import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import { getShopActivation } from "@/lib/onboarding/shop-activation-service";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const activation = await getShopActivation(shop);
    const bookingUrl = buildShopLiffUrl(shop.slug) ?? buildShopWebUrl(shop.slug);
    return NextResponse.json({ activation, bookingUrl, slug: shop.slug });
  } catch (error) {
    return jsonError(error);
  }
}
