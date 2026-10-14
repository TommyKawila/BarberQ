import { getStore } from "@/lib/data";
import {
  appointmentMatchesCode,
  parseBookingCodeFromText,
} from "@/lib/line/booking-code";
import { buildBookingConfirmFlexPair } from "@/lib/line/booking-confirm-notify";
import { claimWebhookEvent, recordLineMessage } from "@/lib/line/message-log";
import { replyMessages } from "@/lib/line/messaging-api";
import { getShopLineChannelSecrets } from "@/lib/line/shop-channel";

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
        shop,
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
  shop: { id: string; slug: string; name: string };
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

  const pair = await buildBookingConfirmFlexPair(input.shop, appointment);
  if (!pair) return;

  const ok = await replyMessages(input.accessToken, input.replyToken, [
    pair.confirm,
    pair.ticket,
  ]);
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
