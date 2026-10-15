import { getStore } from "@/lib/data";
import { buildShopCustomerUrl } from "@/lib/line/liff-url";
import { pushTextForShop, type PushResult } from "@/lib/line/push-message";
import {
  aheadCount,
  queuePosition,
  shouldNotifyQueueAhead,
  sortWaitingByJoinOrder,
} from "@/lib/queue/qr-queue-logic";
import {
  listWaitingQrQueue,
  markQrQueueAheadNotified,
} from "@/lib/queue/qr-queue-store";

export async function notifyQueueAheadForShop(shopId: string): Promise<{
  attempted: number;
  sent: number;
}> {
  const shop = (await getStore().listShops()).find((s) => s.id === shopId);
  if (!shop) return { attempted: 0, sent: 0 };

  const settings = await getStore().getShopSettings(shopId);
  if (!settings.queueAheadPushEnabled) {
    return { attempted: 0, sent: 0 };
  }

  const waiting = sortWaitingByJoinOrder(await listWaitingQrQueue(shopId));
  let attempted = 0;
  let sent = 0;

  for (const entry of waiting) {
    if (entry.ahead_notified_at) continue;
    const position = queuePosition(entry.id, waiting);
    const ahead = aheadCount(position);
    if (!shouldNotifyQueueAhead(ahead)) continue;

    attempted += 1;
    const result = await pushQueueAheadMessage(shopId, shop.slug, shop.name, entry.customer_line_id);
    if (result.sent) {
      await markQrQueueAheadNotified(entry.id);
      sent += 1;
    } else if (result.skippedReason === "disabled" || result.skippedReason === "quota_full") {
      // stop burning attempts when shop cannot push
      break;
    }
  }

  return { attempted, sent };
}

async function pushQueueAheadMessage(
  shopId: string,
  shopSlug: string,
  shopName: string,
  lineUserId: string,
): Promise<PushResult> {
  const liveUrl = buildShopCustomerUrl(shopSlug, "/q/me");
  const text =
    `ใกล้ถึงคิวแล้วที่ ${shopName}\n` +
    `เหลืออีก 2 คิวก่อนถึงคุณ\n` +
    `ดูคิวของฉัน: ${liveUrl}`;
  return pushTextForShop(shopId, lineUserId, text, "push_queue_ahead");
}
