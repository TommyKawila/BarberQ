import webpush from "web-push";
import { formatInTimeZone } from "date-fns-tz";
import { th } from "date-fns/locale";
import { getStore } from "@/lib/data";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import {
  getBarberWebpushScope,
  listWebPushSubscriptions,
  type WebPushSubscriptionRow,
} from "@/lib/webpush/subscriptions";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isWebPushConfigured,
} from "@/lib/webpush/vapid";
import type { Appointment } from "@/types/booking";

export type WebPushEvent = "new_booking" | "cancel" | "line_quota_full";

function configureVapid() {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
  return true;
}

function whenLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "EEE d MMM HH:mm", {
    locale: th,
  });
}

function sourceLabel(source?: string | null): string {
  if (source === "phone") return "จองผ่านโทร";
  if (source === "chat") return "จองผ่านแชท";
  if (source === "walk_in") return "Walk-in";
  return "จองผ่าน LINE";
}

export function buildWebPushPayload(input: {
  event: WebPushEvent;
  shopName: string;
  shopSlug: string;
  appointment: Appointment;
  barberName: string;
}): { title: string; body: string; url: string; tag: string } {
  const when = whenLabel(input.appointment.start_time);
  // Privacy: never include customer phone on lock screen.
  const customer = input.appointment.customer_name || "ลูกค้า";
  if (input.event === "new_booking") {
    return {
      title: `BarberQx · ${input.shopName}`,
      body: `📅 จองใหม่: ${when}\n${customer} · ${input.barberName} · ${sourceLabel(input.appointment.source)}`,
      url: `${buildShopWebUrl(input.shopSlug)}/admin`,
      tag: `booking-${input.appointment.id}`,
    };
  }
  if (input.event === "line_quota_full") {
    return {
      title: `BarberQx · ${input.shopName}`,
      body: `โควตา LINE push เต็มแล้ว · แจ้งเตือนก่อนคิวหยุดส่งชั่วคราว · ร้านต้องอัปเกรดแพ็กเกจกับ LINE เอง`,
      url: `${buildShopWebUrl(input.shopSlug)}/admin/settings/line/quota`,
      tag: `line-quota-${input.shopSlug}`,
    };
  }
  return {
    title: `BarberQx · ${input.shopName}`,
    body: `✗ ยกเลิก: ${when}\n${customer} · ${input.barberName} · ช่องนี้ว่างแล้ว`,
    url: `${buildShopWebUrl(input.shopSlug)}/admin`,
    tag: `cancel-${input.appointment.id}`,
  };
}

function shouldNotify(
  sub: WebPushSubscriptionRow,
  event: WebPushEvent,
  appointmentBarberId: string,
  scope: "own" | "all",
): boolean {
  if (event === "line_quota_full") {
    return sub.staffRole === "owner" || sub.staffRole === "manager";
  }
  if (event === "new_booking" && !sub.notifyNewBooking) return false;
  if (event === "cancel" && !sub.notifyCancel) return false;

  if (sub.staffRole === "owner" || sub.staffRole === "manager") return true;

  if (scope === "all") return true;
  return Boolean(sub.barberId && sub.barberId === appointmentBarberId);
}

export async function notifyStaffWebPush(input: {
  shopId: string;
  shopSlug: string;
  shopName: string;
  appointment: Appointment;
  event: WebPushEvent;
}): Promise<number> {
  if (!isWebPushConfigured() || !configureVapid()) {
    console.warn(JSON.stringify({ event: "webpush_skipped", reason: "missing_vapid" }));
    return 0;
  }

  const store = getStore();
  const barber = await store.getBarber(input.appointment.barber_id);
  const scope = await getBarberWebpushScope(input.shopId);
  const subs = await listWebPushSubscriptions(input.shopId);
  const payload = buildWebPushPayload({
    event: input.event,
    shopName: input.shopName,
    shopSlug: input.shopSlug,
    appointment: input.appointment,
    barberName: barber?.name ?? "—",
  });

  let sent = 0;
  for (const sub of subs) {
    if (!shouldNotify(sub, input.event, input.appointment.barber_id, scope)) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (err) {
      console.warn(
        JSON.stringify({
          event: "webpush_send_failed",
          status: err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined,
        }),
      );
    }
  }
  return sent;
}
