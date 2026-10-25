import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveAutoReplyCheck } from "@/lib/line/connection-test";
import {
  __resetShopLineChannelsForTests,
  upsertShopLineChannel,
} from "@/lib/line/shop-channel";

const shopId = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  __resetShopLineChannelsForTests();
});

describe("resolveAutoReplyCheck", () => {
  it("returns manual (not pass) when owner has not confirmed — LINE cannot report auto-reply", () => {
    const check = resolveAutoReplyCheck(null);
    assert.equal(check.id, "auto_reply");
    assert.equal(check.status, "manual");
    assert.equal(check.ok, false);
    assert.equal(check.labelKey, "lineConnect.check.autoReplyManual");
  });

  it("returns pass only after autoReplyConfirmedAt is set", () => {
    const check = resolveAutoReplyCheck("2026-10-25T00:00:00.000Z");
    assert.equal(check.status, "pass");
    assert.equal(check.ok, true);
    assert.equal(check.labelKey, "lineConnect.check.autoReply");
  });
});

describe("auto-reply confirm persistence", () => {
  it("stores and clears autoReplyConfirmedAt around secret rotation", async () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
    const first = await upsertShopLineChannel(shopId, {
      messagingChannelId: "1",
      channelSecret: "secret-one",
      accessToken: "token-one",
      autoReplyConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(first.autoReplyConfirmedAt, "2026-01-01T00:00:00.000Z");

    const rotated = await upsertShopLineChannel(shopId, {
      channelSecret: "secret-two",
    });
    assert.equal(rotated.autoReplyConfirmedAt, null);

    const confirmed = await upsertShopLineChannel(shopId, {
      autoReplyConfirmedAt: "2026-02-01T00:00:00.000Z",
    });
    assert.equal(confirmed.autoReplyConfirmedAt, "2026-02-01T00:00:00.000Z");
  });
});
