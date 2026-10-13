import { getStore } from "@/lib/data";
import {
  appointmentMatchesCode,
  parseBookingCodeFromText,
} from "@/lib/line/booking-code";
import {
  buildBookingConfirmFlex,
  buildQueueTicketFlex,
} from "@/lib/line/flex-messages";
import { claimWebhookEvent, recordLineMessage } from "@/lib/line/message-log";
import { replyMessages } from "@/lib/line/messaging-api";
import { getShopLineChannelSecrets } from "@/lib/line/shop-channel";
import { buildShopWebUrl } from "@/lib/line/liff-url";

interface LineEvent {
  type: string;
  replyToken?: string;
  webhookEventId?: string;
  source?: { userId?: string; type?: string };
  message?: { type?: string; text?: string };
  timestamp?: number;
}

interface LineWebhookBody {
  destination?: string;
  events?: LineEvent[];
}

export async function handleShopLineWebhook(
  shopId: string,
  body: LineWebhookBody,
): Promise<void> {
  const secrets = await getShopLineChannelSecrets(shopId);
  if (!secrets.accessToken) return;

  const store = getStore();
  const shop = (await store.listShops()).find((s) => s.id === shopId);
  if (!shop) return;

  for (const event of body.events ?? []) {
    const eventId = event.webhookEventId ?? "";
    const fresh = await claimWebhookEvent(shopId, eventId || `${event.timestamp}-${event.type}`);
    if (!fresh) continue;

    if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
      const code = parseBookingCodeFromText(event.message.text ?? "");
      if (!code) continue;
      await replyBookingConfirm({
        shopId,
        shopSlug: shop.slug,
        shopName: shop.name,
        accessToken: secrets.accessToken,
        replyToken: event.replyToken,
        lineUserId: event.source?.userId ?? "",
        code,
      });
    }

    if (event.type === "follow" && event.replyToken) {
      await replyMessages(secrets.accessToken, event.replyToken, [
        {
          type: "text",
          text: `ยินดีต้อนรับสู่ ${shop.name} — จองคิวผ่านเมนูด้านล่างได้เลย`,
        },
      ]);
      await recordLineMessage({
        shopId,
        kind: "reply_confirm",
        counted: false,
        recipientLineId: event.source?.userId,
        success: true,
      });
    }
  }
}

async function replyBookingConfirm(input: {
  shopId: string;
  shopSlug: string;
  shopName: string;
  accessToken: string;
  replyToken: string;
  lineUserId: string;
  code: string;
}) {
  const store = getStore();
  const appointments = input.lineUserId
    ? await store.listCustomerAppointments(input.lineUserId)
    : [];
  const appointment =
    appointments.find(
      (a) =>
        a.status === "confirmed" &&
        appointmentMatchesCode(a.id, input.code),
    ) ?? null;
  if (!appointment) return;

  const barber = await store.getBarber(appointment.barber_id);
  const myBookingsUrl = `${buildShopWebUrl(input.shopSlug)}/bookings`;
  const cancelUrl = appointment.cancel_token
    ? `${buildShopWebUrl(input.shopSlug)}/c/${appointment.cancel_token}`
    : myBookingsUrl;

  const dayStart = new Date(appointment.start_time);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayAppts = (await store.listDayAppointments(dayStart, dayEnd)).filter(
    (a) => a.status === "confirmed" && a.barber_id === appointment.barber_id,
  );
  dayAppts.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const index = dayAppts.findIndex((a) => a.id === appointment.id);
  const ahead = Math.max(0, index);
  const queueLabel = `Q-${String(index + 1).padStart(2, "0")}`;
  const waitMinutes = ahead * (barber?.slot_duration_minutes ?? 30);

  const confirm = buildBookingConfirmFlex({
    shopName: input.shopName,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    barberName: barber?.name ?? "—",
    appointmentId: appointment.id,
    myBookingsUrl,
    cancelUrl,
  });
  const ticket = buildQueueTicketFlex({
    shopName: input.shopName,
    queueLabel,
    aheadCount: ahead,
    waitMinutes,
    liveUrl: myBookingsUrl,
  });

  const ok = await replyMessages(input.accessToken, input.replyToken, [confirm, ticket]);
  await recordLineMessage({
    shopId: input.shopId,
    kind: "reply_confirm",
    counted: false,
    recipientLineId: input.lineUserId,
    appointmentId: appointment.id,
    success: ok,
  });
  await recordLineMessage({
    shopId: input.shopId,
    kind: "reply_ticket",
    counted: false,
    recipientLineId: input.lineUserId,
    appointmentId: appointment.id,
    success: ok,
  });
}
