import { NextResponse } from "next/server";
import { assertStaff, assertCanManageBarber } from "@/lib/admin-auth";
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
    const barber = await assertCanManageBarber(staff, id);
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
    await assertCanManageBarber(staff, id);

    const body = await readJson<{
      offDays?: number[];
      slotDuration?: number;
      name?: string;
      lineId?: string | null;
      isBookable?: boolean;
    }>(req);

    const isOwner = staff.role === "owner";
    if (!isOwner && (body.name !== undefined || body.lineId !== undefined || body.isBookable !== undefined)) {
      throw new BookingError("FORBIDDEN", "Shop owner required", 403);
    }

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
    if (body.name !== undefined && !body.name.trim()) {
      throw new BookingError("INVALID_NAME", "Barber name is required", 400);
    }

    const barber = await getStore().updateBarber(id, {
      offDays: body.offDays !== undefined ? normalizeOffDays(body.offDays) : undefined,
      slotDuration: body.slotDuration,
      name: isOwner ? body.name?.trim() : undefined,
      lineId: isOwner ? body.lineId : undefined,
      isBookable: isOwner ? body.isBookable : undefined,
    });
    return NextResponse.json({ barber });
  } catch (error) {
    return jsonError(error);
  }
}
