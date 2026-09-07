import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getAvailableSlots } from "@/lib/services/booking-service";
import { getStore } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get("barberId");
    const date = searchParams.get("date");

    if (!barberId || !date) {
      return NextResponse.json(
        { error: { code: "INVALID_QUERY", message: "barberId and date are required" } },
        { status: 400 },
      );
    }

    const barber = await getStore().getBarber(barberId);
    if (!barber || barber.shop_id !== shop.id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }

    const slots = await getAvailableSlots(barberId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    return jsonError(error);
  }
}
