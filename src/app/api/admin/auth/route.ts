import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const staff = await assertStaff(req);
    return NextResponse.json({
      barberId: staff.barberId ?? staff.staffId,
      barberName: staff.name,
      role: staff.role,
      shopId: staff.shopId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
