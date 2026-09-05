import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { createBooking } from "@/lib/services/booking-service";
import type { CreateBookingInput } from "@/types/booking";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJson<CreateBookingInput>(req);
    const appointment = await createBooking({
      barberId: body.barberId,
      startTime: body.startTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerRef: body.customerRef,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
