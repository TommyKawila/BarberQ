import { NextResponse } from "next/server";
import { assertStaff, assertSuperAdmin } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import type { ShopSettings } from "@/lib/data/types";
import { isValidLogoDataUrl } from "@/lib/image/fit-logo";
import { isValidShopName, normalizeShopName } from "@/lib/shop/shop-name";
import {
  isValidShopLineUrl,
  isValidShopPhone,
  normalizeShopLineUrl,
  normalizeShopPhone,
} from "@/lib/shop/shop-contact";
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
    const staff = await assertStaff(req);
    assertSuperAdmin(staff);
    const body = await readJson<{
      logoDataUrl?: string | null;
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
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

    if ("lineUrl" in body) {
      const lineUrl = normalizeShopLineUrl(body.lineUrl);
      if (!isValidShopLineUrl(lineUrl)) {
        throw new BookingError("INVALID_LINE_URL", "Invalid LINE URL", 400);
      }
      next.lineUrl = lineUrl;
    }

    if ("phone" in body) {
      const phone = normalizeShopPhone(body.phone);
      if (!isValidShopPhone(phone)) {
        throw new BookingError("INVALID_PHONE", "Invalid shop phone", 400);
      }
      next.phone = phone;
    }

    await getStore().setShopSettings(next);
    return NextResponse.json(next);
  } catch (error) {
    return jsonError(error);
  }
}
