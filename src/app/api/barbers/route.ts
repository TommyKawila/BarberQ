import { NextResponse } from "next/server";
import { isAdminAuthRequired } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { isPrototypeMode } from "@/lib/data";
import { listBarbers } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const barbers = await listBarbers();
    const adminAuthRequired = isAdminAuthRequired();
    return NextResponse.json({
      barbers,
      prototypeMode: isPrototypeMode(),
      adminAuthRequired,
      adminKeyRequired: adminAuthRequired,
    });
  } catch (error) {
    return jsonError(error);
  }
}
