import { after as afterResponse, NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { notifyCustomerSelfRescheduleTicket } from "@/lib/line/customer-reschedule-notify";
import {
  BookingError,
  rescheduleBookingByToken,
} from "@/lib/services/booking-service";
import { resolveShopFromAppointment } from "@/lib/shop/shop-from-appointment";
import { notifyStaffWebPush } from "@/lib/webpush/notify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      cancelToken?: string;
      barberId?: string;
      startTime?: string;
    }>(req);
    const cancelToken = body.cancelToken?.trim() ?? "";
    const barberId = body.barberId?.trim() ?? "";
    const startTime = body.startTime?.trim() ?? "";
    if (!cancelToken) {
      throw new BookingError("INVALID_TOKEN", "Cancel token is required", 400);
    }
    if (!barberId || !startTime) {
      throw new BookingError("INVALID_SLOT", "Barber and start time are required", 400);
    }

    const { before, after } = await rescheduleBookingByToken(
      cancelToken,
      barberId,
      startTime,
    );
    const shop = await resolveShopFromAppointment(after);
    if (shop) {
      // Keep isolate alive so cross-barber notify (extra barber lookups) finishes.
      afterResponse(async () => {
        try {
          await notifyCustomerSelfRescheduleTicket(shop, before, after);
        } catch (err) {
          console.warn(
            JSON.stringify({
              event: "customer_reschedule_notify_failed",
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
