import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyQuota } from "@/lib/line/quota";
import {
  __resetLineMessageLogForTests,
  countCountedPushesThisMonth,
  recordLineMessage,
} from "@/lib/line/message-log";
import {
  __resetShopLineChannelsForTests,
  upsertShopLineChannel,
} from "@/lib/line/shop-channel";
import { pushTextForShop } from "@/lib/line/push-message";

const KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

afterEach(() => {
  __resetLineMessageLogForTests();
  __resetShopLineChannelsForTests();
  delete process.env.APP_ENCRYPTION_KEY;
});

describe("classifyQuota", () => {
  it("marks ok / warn / full thresholds", () => {
    assert.equal(classifyQuota(0, 300), "ok");
    assert.equal(classifyQuota(239, 300), "ok");
    assert.equal(classifyQuota(240, 300), "warn");
    assert.equal(classifyQuota(300, 300), "full");
  });
});

describe("push quota guard", () => {
  it("stops counted push at budget without crashing", async () => {
    process.env.APP_ENCRYPTION_KEY = KEY;
    const shopId = "00000000-0000-0000-0000-000000000099";
    await upsertShopLineChannel(shopId, {
      messagingChannelId: "2000",
      channelSecret: "secret-value-xxxx",
      accessToken: "token-value-yyyy",
      monthlyPushBudget: 2,
      status: "verified",
    });
    await recordLineMessage({ shopId, kind: "push_cancel", counted: true });
    await recordLineMessage({ shopId, kind: "push_cancel", counted: true });
    assert.equal(await countCountedPushesThisMonth(shopId), 2);

    const result = await pushTextForShop(shopId, "U123", "hello", "push_cancel");
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "quota_full");
  });
});
