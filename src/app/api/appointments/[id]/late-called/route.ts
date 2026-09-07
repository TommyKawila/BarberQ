import { NextResponse } from "next/server";
import { assertStaff, canManageBarber } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { BookingError, markLateCalled } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    const existing = await getStore().getAppointment(id);
    if (!existing) {
      throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    }
    if (!canManageBarber(staff, existing.barber_id)) {
      throw new BookingError("FORBIDDEN", "Cannot manage other barbers", 403);
    }
    const appointment = await markLateCalled(id);
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
