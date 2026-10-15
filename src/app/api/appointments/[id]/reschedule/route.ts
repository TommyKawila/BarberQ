import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { notifyCustomerShopReschedule } from "@/lib/line/shop-reschedule-notify";
import {
  BookingError,
  staffRescheduleBooking,
} from "@/lib/services/booking-service";
import { resolveShopFromAppointment } from "@/lib/shop/shop-from-appointment";
import { notifyStaffWebPush } from "@/lib/webpush/notify";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    await assertCanManageAppointment(staff, id);

    const body = await readJson<{ barberId?: string; startTime?: string }>(req);
    const barberId = body.barberId?.trim() ?? "";
    const startTime = body.startTime?.trim() ?? "";
    if (!barberId || !startTime) {
      throw new BookingError("INVALID_SLOT", "Barber and start time are required", 400);
    }

    const { before, after } = await staffRescheduleBooking(id, barberId, startTime);
    const shop = await resolveShopFromAppointment(after);
    if (shop) {
      void notifyCustomerShopReschedule(shop, before, after).catch(() => {});
      void notifyStaffWebPush({
        shopId: shop.id,
        shopSlug: shop.slug,
        shopName: shop.name,
        appointment: after,
        event: "reschedule",
        previousBarberId: before.barber_id,
        previousStartTime: before.start_time,
      }).catch(() => {});
    }
    return NextResponse.json({ appointment: after, previous: before });
  } catch (error) {
    return jsonError(error);
  }
}
