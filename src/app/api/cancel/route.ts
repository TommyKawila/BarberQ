import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { cancelBookingByToken } from "@/lib/services/booking-service";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopFromAppointment } from "@/lib/shop/shop-from-appointment";
import { notifyStaffWebPush } from "@/lib/webpush/notify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ cancelToken?: string }>(req);
    const cancelToken = body.cancelToken?.trim() ?? "";
    if (!cancelToken) {
      throw new BookingError("INVALID_TOKEN", "Cancel token is required", 400);
    }
    const appointment = await cancelBookingByToken(cancelToken);
    const shop = await resolveShopFromAppointment(appointment);
    if (shop) {
      void notifyStaffWebPush({
        shopId: shop.id,
        shopSlug: shop.slug,
        shopName: shop.name,
        appointment,
        event: "cancel",
      }).catch(() => {});
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
