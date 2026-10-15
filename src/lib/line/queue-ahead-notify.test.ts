import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { __resetLineMessageLogForTests } from "@/lib/line/message-log";
import { notifyQueueAheadForShop } from "@/lib/line/queue-ahead-notify";
import { joinQrQueue } from "@/lib/queue/qr-queue-service";

describe("queue-ahead notify", () => {
  it("skips when queueAheadPushEnabled is OFF", async () => {
    __resetLineMessageLogForTests();
    const shop = await memoryStore.createShop({
      name: `QR Ahead ${Date.now()}`,
      subscriptionMonths: 1,
    });
    const settings = await memoryStore.getShopSettings(shop.id);
    await memoryStore.setShopSettings(shop.id, {
      ...settings,
      queueAheadPushEnabled: false,
    });

    await joinQrQueue({
      shopId: shop.id,
      customerLineId: "ahead-a",
      customerName: "A",
    });
    await joinQrQueue({
      shopId: shop.id,
      customerLineId: "ahead-b",
      customerName: "B",
    });
    await joinQrQueue({
      shopId: shop.id,
      customerLineId: "ahead-c",
      customerName: "C",
    });

    const result = await notifyQueueAheadForShop(shop.id);
    assert.equal(result.attempted, 0);
    assert.equal(result.sent, 0);
  });
});
