import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { createBooking, listCustomerBookings } from "@/lib/services/booking-service";
import type { CreateBookingInput } from "@/types/booking";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lineId = searchParams.get("lineId");
    if (!lineId) {
      return NextResponse.json(
        { error: { code: "MISSING_LINE_ID", message: "Line ID required" } },
        { status: 400 },
      );
    }
    const appointments = await listCustomerBookings(lineId);
    return NextResponse.json({ appointments });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<CreateBookingInput>(req);
    const appointment = await createBooking({
      barberId: body.barberId,
      startTime: body.startTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerRef: body.customerRef,
      customerLineId: body.customerLineId,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
