import { NextResponse } from "next/server";
import {
  assertStaff,
  canManageBarber,
  isAdminAuthRequired,
} from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore, isPrototypeMode } from "@/lib/data";
import { isAdminKeyRequired } from "@/lib/env";
import {
  createBlock,
  getAdminDay,
  removeBlock,
} from "@/lib/services/booking-service";
import { BookingError } from "@/lib/services/booking-service";
import { dateISOFromInstant } from "@/lib/services/slot-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const staff = await assertStaff(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? dateISOFromInstant(new Date());
    const columns = await getAdminDay(date);
    return NextResponse.json({
      date,
      columns,
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        barberId: staff.barberId,
      },
      prototypeMode: isPrototypeMode(),
      adminAuthRequired: isAdminAuthRequired(),
      adminKeyRequired: isAdminKeyRequired(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const staff = await assertStaff(req);
    const body = await readJson<{
      barberId?: string;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }>(req);

    const barberId = body.barberId ?? "";
    if (!canManageBarber(staff, barberId)) {
      throw new BookingError("FORBIDDEN", "Cannot manage other barbers", 403);
    }

    const block = await createBlock({
      barberId,
      startTime: body.startTime ?? "",
      endTime: body.endTime ?? "",
      reason: body.reason,
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const staff = await assertStaff(req);
    const body = await readJson<{ id?: string }>(req);
    const id = body.id ?? "";

    if (staff.role === "barber") {
      const block = await getStore().getBlock(id);
      if (!block) {
        throw new BookingError("NOT_FOUND", "Block not found", 404);
      }
      if (block.barber_id !== staff.barberId) {
        throw new BookingError("FORBIDDEN", "Cannot delete other barber blocks", 403);
      }
    }

    await removeBlock(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
