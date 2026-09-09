import { NextResponse } from "next/server";
import { assertStaffForShop, assertShopOwner } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import type { ShopSettings } from "@/lib/data/types";
import { isValidLogoDataUrl } from "@/lib/image/fit-logo";
import { resolveShopParam } from "@/lib/shop/api-route";
import { isValidShopName, normalizeShopName } from "@/lib/shop/shop-name";
import {
  isValidShopLineUrl,
  isValidShopPhone,
  normalizeShopLineUrl,
  normalizeShopPhone,
} from "@/lib/shop/shop-contact";
import { BookingError } from "@/lib/services/booking-service";
import { validateShopHours } from "@/lib/schedule/validation";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const settings = await getStore().getShopSettings(shop.id);
    const { shopId: _shopId, ...publicSettings } = settings;
    return NextResponse.json(publicSettings);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const body = await readJson<{
      logoDataUrl?: string | null;
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
      hours?: ShopHours;
    }>(req);

    const current = await getStore().getShopSettings(shop.id);
    const next: Omit<ShopSettings, "shopId"> = {
      logoDataUrl: current.logoDataUrl,
      shopName: current.shopName,
      lineUrl: current.lineUrl,
      phone: current.phone,
      hours: current.hours,
    };

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

    if ("hours" in body && body.hours) {
      const hours = normalizeShopHours(body.hours);
      const hoursError = validateShopHours(hours);
      if (hoursError) {
        throw new BookingError("INVALID_HOURS", hoursError, 400);
      }
      next.hours = hours;
    }

    await getStore().setShopSettings(shop.id, next);
    return NextResponse.json(next);
  } catch (error) {
    return jsonError(error);
  }
}
