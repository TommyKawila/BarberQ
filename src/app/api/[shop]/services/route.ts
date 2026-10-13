import { NextResponse } from "next/server";
import { assertStaffForShop, isShopOperatorRole } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { BookingError } from "@/lib/services/booking-service";
import { createShopService, listShopServices } from "@/lib/services/shop-services";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "1";
    const services = await listShopServices(shop.id, { includeInactive });
    return NextResponse.json({ services });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    if (!isShopOperatorRole(staff.role)) {
      throw new BookingError("FORBIDDEN", "Owner/manager only", 403);
    }
    const body = await readJson<{
      name?: string;
      priceBaht?: number;
      isDefault?: boolean;
    }>(req);
    if (!body.name?.trim()) {
      throw new BookingError("INVALID_INPUT", "Name required", 400);
    }
    if (body.priceBaht == null || !Number.isFinite(body.priceBaht)) {
      throw new BookingError("INVALID_PRICE", "Price required", 400);
    }
    const service = await createShopService({
      shopId: shop.id,
      name: body.name,
      priceBaht: body.priceBaht,
      isDefault: body.isDefault,
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
