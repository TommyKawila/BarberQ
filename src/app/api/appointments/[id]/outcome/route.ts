import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import {
  BookingError,
  markAppointmentOutcome,
} from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    const body = await readJson<{ outcome?: string }>(req);
    const outcome = body.outcome;

    if (outcome !== "completed" && outcome !== "no_show") {
      throw new BookingError("INVALID_OUTCOME", "Invalid outcome", 400);
    }

    await assertCanManageAppointment(staff, id);
    const appointment = await markAppointmentOutcome(id, outcome);
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
