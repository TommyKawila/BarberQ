import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { cancelBooking } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ appointmentId?: string; customerRef?: string }>(req);
    const appointment = await cancelBooking(
      body.appointmentId ?? "",
      body.customerRef ?? "",
    );
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
