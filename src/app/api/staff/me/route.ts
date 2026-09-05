import { NextResponse } from "next/server";
import {
  assertStaff,
  isAdminAuthRequired,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { isPrototypeMode } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const staff = await assertStaff(req);
    return NextResponse.json({
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        barberId: staff.barberId,
      },
      prototypeMode: isPrototypeMode(),
      adminAuthRequired: isAdminAuthRequired(),
    });
  } catch (error) {
    if (error instanceof BookingError && error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: error.message },
          prototypeMode: isPrototypeMode(),
          adminAuthRequired: isAdminAuthRequired(),
        },
        { status: 401 },
      );
    }
    return jsonError(error);
  }
}
