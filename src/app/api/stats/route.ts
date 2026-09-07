import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";
import { getStatsReport, type StatsRange } from "@/lib/services/stats-service";
import { dateISOFromInstant } from "@/lib/services/slot-service";

export const runtime = "nodejs";

function parseRange(value: string | null): StatsRange {
  if (value === "week" || value === "month") return value;
  return "day";
}

export async function GET(req: Request) {
  try {
    const staff = await assertStaff(req);
    const { searchParams } = new URL(req.url);
    const range = parseRange(searchParams.get("range"));
    const date = searchParams.get("date") ?? dateISOFromInstant(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
    }

    const report = await getStatsReport(range, date, staff);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE") {
      return jsonError(new BookingError("INVALID_DATE", "Date must be YYYY-MM-DD", 400));
    }
    return jsonError(error);
  }
}
