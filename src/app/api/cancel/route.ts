import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { BookingError, cancelBooking, cancelBookingByToken } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      appointmentId?: string;
      customerRef?: string;
      cancelToken?: string;
    }>(req);

    const cancelToken = body.cancelToken?.trim() ?? "";
    if (cancelToken) {
      const appointment = await cancelBookingByToken(cancelToken);
      return NextResponse.json({ appointment });
    }

    if (!body.appointmentId || !body.customerRef) {
      throw new BookingError("INVALID_CUSTOMER", "Cancel token or customer reference is required", 400);
    }

    const appointment = await cancelBooking(body.appointmentId, body.customerRef);
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
