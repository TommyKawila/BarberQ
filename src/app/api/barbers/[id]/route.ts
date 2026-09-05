import { NextResponse } from "next/server";
import { assertStaff, canManageBarber } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import {
  normalizeOffDays,
  validateOffDays,
  validateSlotDuration,
} from "@/lib/schedule/validation";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    if (!canManageBarber(staff, id)) {
      throw new BookingError("FORBIDDEN", "Cannot view other barbers", 403);
    }
    const barber = await getStore().getBarber(id);
    if (!barber) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    return NextResponse.json({ barber });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    if (!canManageBarber(staff, id)) {
      throw new BookingError("FORBIDDEN", "Cannot edit other barbers", 403);
    }

    const body = await readJson<{
      offDays?: number[];
      slotDuration?: number;
    }>(req);

    if (body.offDays !== undefined) {
      const offDays = normalizeOffDays(body.offDays);
      const offError = validateOffDays(offDays);
      if (offError) {
        throw new BookingError("INVALID_OFF_DAYS", offError, 400);
      }
    }
    if (body.slotDuration !== undefined) {
      const durationError = validateSlotDuration(body.slotDuration);
      if (durationError) {
        throw new BookingError("INVALID_SLOT_DURATION", durationError, 400);
      }
    }

    const barber = await getStore().updateBarber(id, {
      offDays: body.offDays !== undefined ? normalizeOffDays(body.offDays) : undefined,
      slotDuration: body.slotDuration,
    });
    return NextResponse.json({ barber });
  } catch (error) {
    return jsonError(error);
  }
}
