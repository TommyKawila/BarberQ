import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { cancelBookingByToken } from "@/lib/services/booking-service";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ cancelToken?: string }>(req);
    const cancelToken = body.cancelToken?.trim() ?? "";
    if (!cancelToken) {
      throw new BookingError("INVALID_TOKEN", "Cancel token is required", 400);
    }
    const appointment = await cancelBookingByToken(cancelToken);
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
