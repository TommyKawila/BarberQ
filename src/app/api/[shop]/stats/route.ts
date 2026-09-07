import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getStatsReport, type StatsRange } from "@/lib/services/stats-service";
import { BookingError } from "@/lib/services/booking-service";
import { dateISOFromInstant } from "@/lib/services/slot-service";

export const runtime = "nodejs";

function parseRange(value: string | null): StatsRange {
  if (value === "week" || value === "month") return value;
  return "day";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
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
