import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  deleteWebPushSubscription,
  getBarberWebpushScope,
  getStaffWebPushSubscription,
  updateWebPushPreferences,
  upsertWebPushSubscription,
} from "@/lib/webpush/subscriptions";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") ?? undefined;
    const subscription = await getStaffWebPushSubscription(
      shop.id,
      staff.staffId,
      endpoint,
    );
    const barberScope = await getBarberWebpushScope(shop.id);
    return NextResponse.json({
      subscription,
      barberScope,
      staff: {
        id: staff.staffId,
        name: staff.name,
        role: staff.role,
        barberId: staff.barberId,
      },
    });
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
    const body = await readJson<{
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      userAgent?: string;
      deviceLabel?: string;
      notifyNewBooking?: boolean;
      notifyCancel?: boolean;
    }>(req);

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      throw new BookingError("INVALID_INPUT", "Missing subscription fields", 400);
    }

    const subscription = await upsertWebPushSubscription(shop.id, {
      staffKey: staff.staffId,
      staffRole: staff.role,
      barberId: staff.barberId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent ?? null,
      deviceLabel: body.deviceLabel ?? null,
      notifyNewBooking: body.notifyNewBooking,
      notifyCancel: body.notifyCancel,
    });
    return NextResponse.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    const body = await readJson<{
      endpoint?: string;
      notifyNewBooking?: boolean;
      notifyCancel?: boolean;
    }>(req);
    if (!body.endpoint) {
      throw new BookingError("INVALID_INPUT", "Missing endpoint", 400);
    }
    const subscription = await updateWebPushPreferences(
      shop.id,
      staff.staffId,
      body.endpoint,
      {
        notifyNewBooking: body.notifyNewBooking,
        notifyCancel: body.notifyCancel,
      },
    );
    return NextResponse.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);
    const body = await readJson<{ endpoint?: string }>(req);
    if (!body.endpoint) {
      throw new BookingError("INVALID_INPUT", "Missing endpoint", 400);
    }
    await deleteWebPushSubscription(shop.id, body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
