import { after as afterResponse, NextResponse } from "next/server";
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
      // Keep isolate alive so cross-barber notify (extra barber lookups) finishes.
      afterResponse(async () => {
        try {
          await notifyCustomerShopReschedule(shop, before, after);
        } catch (err) {
          console.warn(
            JSON.stringify({
              event: "shop_reschedule_notify_failed",
              appointmentId: after.id,
              barberChanged: before.barber_id !== after.barber_id,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }
        try {
          await notifyStaffWebPush({
            shopId: shop.id,
            shopSlug: shop.slug,
            shopName: shop.name,
            appointment: after,
            event: "reschedule",
            previousBarberId: before.barber_id,
            previousStartTime: before.start_time,
          });
        } catch {
          /* ignore webpush */
        }
      });
    }
    return NextResponse.json({ appointment: after, previous: before });
  } catch (error) {
    return jsonError(error);
  }
}
