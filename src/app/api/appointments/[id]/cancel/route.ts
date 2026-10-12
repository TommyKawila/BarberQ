import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { notifyCustomerShopCancel } from "@/lib/line/shop-cancel-notify";
import { staffCancelBooking } from "@/lib/services/booking-service";
import { resolveShopFromAppointment } from "@/lib/shop/shop-from-appointment";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    const { appointment: before } = await assertCanManageAppointment(staff, id);
    const appointment = await staffCancelBooking(id);
    const shop = await resolveShopFromAppointment(appointment);
    if (shop) {
      // Shop-initiated cancel → LINE push (quota-counted). Staff already knows.
      void notifyCustomerShopCancel(shop, before).catch(() => {});
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
