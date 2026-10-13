import { NextResponse } from "next/server";
import { assertStaffForShop, isShopOperatorRole } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { BookingError } from "@/lib/services/booking-service";
import { updateShopService } from "@/lib/services/shop-services";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shop: string; id: string }> },
) {
  try {
    const { shop: shopSlug, id } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    if (!isShopOperatorRole(staff.role)) {
      throw new BookingError("FORBIDDEN", "Owner/manager only", 403);
    }
    const body = await readJson<{
      name?: string;
      priceBaht?: number;
      isDefault?: boolean;
      isActive?: boolean;
      sortOrder?: number;
    }>(req);
    const service = await updateShopService(id, shop.id, {
      name: body.name,
      priceBaht: body.priceBaht,
      isDefault: body.isDefault,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });
    return NextResponse.json({ service });
  } catch (error) {
    return jsonError(error);
  }
}
