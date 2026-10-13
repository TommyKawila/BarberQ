import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  getBarberWebpushScope,
  setBarberWebpushScope,
  type BarberWebpushScope,
} from "@/lib/webpush/subscriptions";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);
    const scope = await getBarberWebpushScope(shop.id);
    return NextResponse.json({ scope });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);
    const body = await readJson<{ scope?: BarberWebpushScope }>(req);
    if (body.scope !== "own" && body.scope !== "all") {
      throw new BookingError("INVALID_INPUT", "scope must be own|all", 400);
    }
    const scope = await setBarberWebpushScope(shop.id, body.scope);
    return NextResponse.json({ scope });
  } catch (error) {
    return jsonError(error);
  }
}
