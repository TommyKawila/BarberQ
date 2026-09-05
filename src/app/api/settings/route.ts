import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import type { ShopSettings } from "@/lib/data/types";
import { isValidLogoDataUrl } from "@/lib/image/fit-logo";
import { isValidShopName, normalizeShopName } from "@/lib/shop/shop-name";
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
    const body = await readJson<{
      logoDataUrl?: string | null;
      shopName?: string | null;
    }>(req);

    const current = await getStore().getShopSettings();
    const next: ShopSettings = { ...current };

    if ("logoDataUrl" in body) {
      const logoDataUrl = body.logoDataUrl ?? null;
      if (logoDataUrl !== null && !isValidLogoDataUrl(logoDataUrl)) {
        throw new BookingError("INVALID_LOGO", "Invalid logo data", 400);
      }
      next.logoDataUrl = logoDataUrl;
    }

    if ("shopName" in body) {
      const shopName = normalizeShopName(body.shopName);
      if (!isValidShopName(shopName)) {
        throw new BookingError("INVALID_SHOP_NAME", "Invalid shop name", 400);
      }
      next.shopName = shopName;
    }

    await getStore().setShopSettings(next);
    return NextResponse.json(next);
  } catch (error) {
    return jsonError(error);
  }
}
