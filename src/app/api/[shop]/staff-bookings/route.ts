import { NextResponse } from "next/server";
import {
  assertStaffForShop,
  canManageBarber,
} from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  BookingError,
  createStaffBooking,
  findNextConflictEnd,
} from "@/lib/services/booking-service";
import { addMinutes } from "date-fns";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    const body = await readJson<{
      barberId?: string;
      startTime?: string;
      endTime?: string;
      source?: string;
      customerName?: string;
      customerPhone?: string;
      allowShorten?: boolean;
    }>(req);

    const barberId = body.barberId ?? "";
    const source = body.source;
    if (source !== "phone" && source !== "chat" && source !== "walk_in") {
      throw new BookingError("INVALID_SOURCE", "Invalid booking source", 400);
    }

    const barber = await getStore().getBarber(barberId);
    if (!barber || barber.shop_id !== shop.id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    if (!(await canManageBarber(staff, barberId))) {
      throw new BookingError("FORBIDDEN", "Cannot manage other barbers", 403);
    }

    const startTime = body.startTime ?? "";
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      throw new BookingError("INVALID_TIME", "Invalid start time", 400);
    }

    try {
      const appointment = await createStaffBooking(shop.id, {
        barberId,
        startTime,
        endTime: body.endTime,
        source,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
      });
      return NextResponse.json({ appointment }, { status: 201 });
    } catch (error) {
      if (
        error instanceof BookingError &&
        error.code === "SLOT_TAKEN" &&
        body.allowShorten !== false &&
        !body.endTime
      ) {
        const proposedEnd = addMinutes(start, barber.slot_duration_minutes);
        const conflictStart = await findNextConflictEnd(barberId, start, proposedEnd);
        if (conflictStart && conflictStart.getTime() - start.getTime() >= 5 * 60_000) {
          return NextResponse.json(
            {
              error: {
                code: "SLOT_TAKEN",
                message: error.message,
                nextConflictAt: conflictStart.toISOString(),
                canShortenUntil: conflictStart.toISOString(),
              },
            },
            { status: 409 },
          );
        }
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
