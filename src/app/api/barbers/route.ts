import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { isPrototypeMode } from "@/lib/data";
import { isAdminKeyRequired } from "@/lib/env";
import { listBarbers } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const barbers = await listBarbers();
    return NextResponse.json({
      barbers,
      prototypeMode: isPrototypeMode(),
      adminKeyRequired: isAdminKeyRequired(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
