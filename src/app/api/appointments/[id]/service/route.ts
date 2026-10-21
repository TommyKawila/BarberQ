import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import {
  BookingError,
  updateCompletedAppointmentService,
} from "@/lib/services/booking-service";

export const runtime = "nodejs";

/** PATCH — change snapshot service/price on a completed appointment. */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    const body = await readJson<{
      serviceId?: string;
      priceBaht?: number | null;
    }>(req);

    if (!body.serviceId) {
      throw new BookingError("INVALID_ID", "Missing serviceId", 400);
    }

    await assertCanManageAppointment(staff, id);
    const appointment = await updateCompletedAppointmentService(id, {
      serviceId: body.serviceId,
      priceBaht: body.priceBaht,
    });
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
