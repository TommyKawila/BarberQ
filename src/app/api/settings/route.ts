import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { isValidLogoDataUrl } from "@/lib/image/fit-logo";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getStore().getShopSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(req: Request) {
  try {
    assertAdmin(req);
    const body = await readJson<{ logoDataUrl?: string | null }>(req);
    const logoDataUrl = body.logoDataUrl ?? null;

    if (logoDataUrl !== null && !isValidLogoDataUrl(logoDataUrl)) {
      throw new BookingError("INVALID_LOGO", "Invalid logo data", 400);
    }

    await getStore().setShopSettings({ logoDataUrl });
    return NextResponse.json({ logoDataUrl });
  } catch (error) {
    return jsonError(error);
  }
}
