import { NextResponse } from "next/server";
import { assertStaff, canManageBarber } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { validateRecurringBreakInput } from "@/lib/schedule/validation";
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
      throw new BookingError("FORBIDDEN", "Cannot view other barber breaks", 403);
    }
    const breaks = await getStore().listRecurringBreaks(id);
    return NextResponse.json({ breaks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
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
      throw new BookingError("FORBIDDEN", "Cannot create breaks for others", 403);
    }

    const body = await readJson<{
      weekday?: number;
      startTime?: string;
      endTime?: string;
    }>(req);

    const weekday = body.weekday;
    const startTime = body.startTime ?? "";
    const endTime = body.endTime ?? "";
    if (weekday === undefined) {
      throw new BookingError("INVALID_INPUT", "weekday is required", 400);
    }

    const validationError = validateRecurringBreakInput({
      weekday,
      startTime,
      endTime,
    });
    if (validationError) {
      throw new BookingError("INVALID_RANGE", validationError, 400);
    }

    const breakRow = await getStore().createRecurringBreak({
      barberId: id,
      weekday,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
    });
    return NextResponse.json({ break: breakRow }, { status: 201 });
  } catch (error) {
    if (error instanceof StoreConflict && error.code === "INVALID_RANGE") {
      return jsonError(new BookingError("INVALID_RANGE", "Invalid break time", 400));
    }
    return jsonError(error);
  }
}

export async function DELETE(
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
      throw new BookingError("FORBIDDEN", "Cannot delete breaks for others", 403);
    }

    const body = await readJson<{ breakId?: string }>(req);
    const breakId = body.breakId ?? "";
    if (!isUuid(breakId)) {
      throw new BookingError("INVALID_ID", "Invalid break id", 400);
    }

    const breaks = await getStore().listRecurringBreaks(id);
    if (!breaks.some((item) => item.id === breakId)) {
      throw new BookingError("NOT_FOUND", "Break not found", 404);
    }

    await getStore().deleteRecurringBreak(breakId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
