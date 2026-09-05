import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getAvailableSlots } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get("barberId");
    const date = searchParams.get("date");

    if (!barberId || !date) {
      return NextResponse.json(
        { error: { code: "INVALID_QUERY", message: "barberId and date are required" } },
        { status: 400 },
      );
    }

    const slots = await getAvailableSlots(barberId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    return jsonError(error);
  }
}
