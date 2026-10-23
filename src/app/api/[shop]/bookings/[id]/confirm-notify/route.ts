import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { pushBookingConfirmFallback } from "@/lib/line/booking-confirm-notify";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fallback when liff.sendMessages is unavailable/fails (rich menu / scope /
 * outside OA chat). Pushes confirm Flex under the shop OA (queue-ticket Flex
 * only when via_qr). Counts toward the 300 monthly push quota.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string; id: string }> },
) {
  try {
    const { shop: shopSlug, id: appointmentId } = await params;
    const shop = await resolveShopParam(shopSlug);
    const customer = await assertVerifiedCustomer(req);

    const store = getStore();
    const appointment = await store.getAppointment(appointmentId);
    if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found", 404);

    const barber = await store.getBarber(appointment.barber_id);
    if (!barber || barber.shop_id !== shop.id) {
      throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    }
    if (appointment.customer_line_id !== customer.userId) {
      throw new BookingError("FORBIDDEN", "Not your booking", 403);
    }
    if (appointment.status !== "confirmed") {
      throw new BookingError("NOT_CANCELLABLE", "Booking cannot be notified", 400);
    }

    const result = await pushBookingConfirmFallback(shop, appointment);
    console.warn(
      JSON.stringify({
        event: "booking_confirm_push_fallback",
        shopId: shop.id,
        appointmentId: appointment.id,
        sent: result.sent,
        skippedReason: result.skippedReason ?? null,
      }),
    );

    return NextResponse.json({
      sent: result.sent,
      skippedReason: result.skippedReason ?? null,
      mode: "push_fallback",
    });
  } catch (error) {
    return jsonError(error);
  }
}
