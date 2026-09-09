import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { markLateCalled } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    await assertCanManageAppointment(staff, id);
    const appointment = await markLateCalled(id);
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
