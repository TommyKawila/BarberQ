import { NextResponse } from "next/server";
import { assertStaffForShop, assertShopOperator } from "@/lib/admin-auth";
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
import {
  DEFAULT_SHOP_REMINDER_LEAD_MINUTES,
  isReminderLeadPreset,
} from "@/lib/reminders/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const settings = await getStore().getShopSettings(shop.id);
    const { shopId: _, ...publicSettings } = settings;
    void _;
    // Brand display: settings override, else shops.name (never leave blank for customers).
    const shopName =
      (publicSettings.shopName ?? "").trim() || shop.name || null;
    return NextResponse.json(
      { ...publicSettings, shopName },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
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
    assertShopOperator(staff);
    const body = await readJson<{
      logoDataUrl?: string | null;
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
      hours?: ShopHours;
      remindersEnabled?: boolean;
      reminderLeadMinutes?: number;
      bookingConfirmPushEnabled?: boolean;
      queueAheadPushEnabled?: boolean;
    }>(req);

    const current = await getStore().getShopSettings(shop.id);
    const next: Omit<ShopSettings, "shopId"> = {
      logoDataUrl: current.logoDataUrl,
      coverImageUrl: current.coverImageUrl,
      shopName: current.shopName,
      lineUrl: current.lineUrl,
      phone: current.phone,
      hours: current.hours,
      remindersEnabled: current.remindersEnabled,
      reminderLeadMinutes: current.reminderLeadMinutes ?? DEFAULT_SHOP_REMINDER_LEAD_MINUTES,
      bookingConfirmPushEnabled: current.bookingConfirmPushEnabled !== false,
      queueAheadPushEnabled: current.queueAheadPushEnabled !== false,
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

    if ("remindersEnabled" in body) {
      next.remindersEnabled = Boolean(body.remindersEnabled);
    }

    if ("reminderLeadMinutes" in body) {
      if (!isReminderLeadPreset(body.reminderLeadMinutes)) {
        throw new BookingError("INVALID_REMINDER_LEAD", "Invalid reminder lead time", 400);
      }
      next.reminderLeadMinutes = body.reminderLeadMinutes;
    }

    if ("bookingConfirmPushEnabled" in body) {
      next.bookingConfirmPushEnabled = Boolean(body.bookingConfirmPushEnabled);
    }

    if ("queueAheadPushEnabled" in body) {
      next.queueAheadPushEnabled = Boolean(body.queueAheadPushEnabled);
    }

    await getStore().setShopSettings(shop.id, next);
    return NextResponse.json(next);
  } catch (error) {
    return jsonError(error);
  }
}
