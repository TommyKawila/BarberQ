import { NextResponse } from "next/server";
import { assertCanManageBarber, assertShopOwner, assertStaff } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    assertShopOwner(staff);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    const updated = await getStore().deactivateBarber(barber.shop_id!, id);
    return NextResponse.json({ barber: updated });
  } catch (error) {
    if (error instanceof StoreConflict && error.code === "HAS_FUTURE_BOOKINGS") {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, count: error.count ?? 0 } },
        { status: 409 },
      );
    }
    return jsonError(error);
  }
}
