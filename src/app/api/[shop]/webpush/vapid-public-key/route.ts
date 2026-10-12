import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/webpush/vapid";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);
    return NextResponse.json({
      publicKey: getVapidPublicKey() ?? null,
      configured: isWebPushConfigured(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
