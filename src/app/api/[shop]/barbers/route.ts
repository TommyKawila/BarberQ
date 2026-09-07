import { NextResponse } from "next/server";
import { isAdminAuthRequired } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { isPrototypeMode } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";
import { listBarbers } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const barbers = await listBarbers(shop.id);
    const adminAuthRequired = isAdminAuthRequired();
    return NextResponse.json({
      barbers,
      prototypeMode: isPrototypeMode(),
      adminAuthRequired,
      adminKeyRequired: adminAuthRequired,
    });
  } catch (error) {
    return jsonError(error);
  }
}
