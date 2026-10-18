import { NextResponse } from "next/server";
import webpush from "web-push";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getStaffWebPushSubscription } from "@/lib/webpush/subscriptions";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isWebPushConfigured,
} from "@/lib/webpush/vapid";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    if (!isWebPushConfigured()) {
      throw new BookingError("MISCONFIGURED", "VAPID keys not configured", 503);
    }
    const body = await readJson<{ endpoint?: string }>(req);
    const sub = await getStaffWebPushSubscription(
      shop.id,
      staff.staffId,
      body.endpoint,
    );
    if (!sub) {
      throw new BookingError("NOT_FOUND", "No subscription on this device", 404);
    }
    webpush.setVapidDetails(
      getVapidSubject(),
      getVapidPublicKey()!,
      getVapidPrivateKey()!,
    );
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: `ClipperQ · ${shop.name}`,
        body: "แจ้งเตือนทดสอบ — Web Push ทำงานแล้ว",
        url: `/${shop.slug}/admin`,
        tag: "webpush-test",
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
