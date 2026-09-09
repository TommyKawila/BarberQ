import { NextResponse } from "next/server";
import { assertStaffForShop, assertShopOwner, isAdminAuthRequired } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { isPrototypeMode } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";
import { listBarbers, listBookableBarbers } from "@/lib/services/booking-service";
import { validateSlotDuration } from "@/lib/schedule/validation";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    let barbers = await listBookableBarbers(shop.id);
    try {
      const staff = await assertStaffForShop(req, shop.id);
      assertShopOwner(staff);
      barbers = await listBarbers(shop.id);
    } catch {
      // public customer listing
    }
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const body = await readJson<{
      name?: string;
      lineId?: string | null;
      slotDuration?: number;
      isBookable?: boolean;
    }>(req);

    const name = body.name?.trim() ?? "";
    if (!name) throw new BookingError("INVALID_NAME", "Barber name is required", 400);
    if (body.slotDuration !== undefined) {
      const err = validateSlotDuration(body.slotDuration);
      if (err) throw new BookingError("INVALID_SLOT_DURATION", err, 400);
    }

    const barber = await getStore().createBarber({
      shopId: shop.id,
      name,
      lineId: body.lineId ?? null,
      slotDuration: body.slotDuration ?? 30,
      isBookable: body.isBookable ?? true,
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
