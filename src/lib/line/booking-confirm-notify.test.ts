import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStore } from "@/lib/data";
import {
  pushBookingConfirmFallback,
  shouldSendLineBookingConfirmPush,
} from "@/lib/line/booking-confirm-notify";
import {
  __resetLineMessageLogForTests,
  countCountedPushesThisMonth,
  recordLineMessage,
} from "@/lib/line/message-log";
import {
  __resetShopLineChannelsForTests,
  upsertShopLineChannel,
} from "@/lib/line/shop-channel";
import type { Appointment, Shop } from "@/types/booking";

const KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SHOP_ID = "00000000-0000-0000-0000-000000000055";

afterEach(async () => {
  __resetLineMessageLogForTests();
  __resetShopLineChannelsForTests();
  delete process.env.APP_ENCRYPTION_KEY;
  const store = getStore();
  const settings = await store.getShopSettings(SHOP_ID);
  await store.setShopSettings(SHOP_ID, {
    ...settings,
    bookingConfirmPushEnabled: true,
  });
});

function shop(): Shop {
  return {
    id: SHOP_ID,
    name: "Demo",
    slug: "demo",
    status: "active",
    subscribed_until: null,
    created_at: "2030-01-01T00:00:00.000Z",
    updated_at: "2030-01-01T00:00:00.000Z",
  };
}

function apt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "00000000-0000-0000-0000-000000000066",
    barber_id: "00000000-0000-0000-0000-000000000077",
    customer_ref: "U-customer",
    customer_name: "ลูกค้า",
    customer_phone: null,
    customer_line_id: "U-customer",
    start_time: "2030-06-01T12:00:00.000Z",
    end_time: "2030-06-01T12:30:00.000Z",
    status: "confirmed",
    source: "line",
    created_at: "2030-06-01T10:00:00.000Z",
    cancel_token: "tok",
    ...overrides,
  };
}

describe("pushBookingConfirmFallback", () => {
  it("gates like shop-cancel: needs LINE id + confirmed", () => {
    assert.equal(
      shouldSendLineBookingConfirmPush({
        status: "confirmed",
        source: "line",
        customer_line_id: "U1",
      }),
      true,
    );
    assert.equal(
      shouldSendLineBookingConfirmPush({
        status: "confirmed",
        source: "phone",
        customer_line_id: "U1",
      }),
      false,
    );
    assert.equal(
      shouldSendLineBookingConfirmPush({
        status: "confirmed",
        source: "line",
        customer_line_id: null,
      }),
      false,
    );
  });

  it("skips non-LINE bookings without consuming quota", async () => {
    const result = await pushBookingConfirmFallback(
      shop(),
      apt({ source: "phone", customer_line_id: null }),
    );
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "invalid_input");
    assert.equal(await countCountedPushesThisMonth(SHOP_ID), 0);
  });

  it("respects quota guard (no send when full)", async () => {
    process.env.APP_ENCRYPTION_KEY = KEY;
    await upsertShopLineChannel(SHOP_ID, {
      messagingChannelId: "2000",
      channelSecret: "secret-value-xxxx",
      accessToken: "token-value-yyyy",
      monthlyPushBudget: 1,
      status: "verified",
    });
    await recordLineMessage({ shopId: SHOP_ID, kind: "push_cancel", counted: true });

    const result = await pushBookingConfirmFallback(shop(), apt());
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "quota_full");
  });

  it("skips push when reply_confirm already succeeded", async () => {
    const a = apt();
    await recordLineMessage({
      shopId: SHOP_ID,
      kind: "reply_confirm",
      counted: false,
      appointmentId: a.id,
      success: true,
    });
    const result = await pushBookingConfirmFallback(shop(), a);
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "already_delivered");
  });

  it("skips entirely when shop bookingConfirmPushEnabled is OFF", async () => {
    const store = getStore();
    const settings = await store.getShopSettings(SHOP_ID);
    await store.setShopSettings(SHOP_ID, {
      ...settings,
      bookingConfirmPushEnabled: false,
    });

    const result = await pushBookingConfirmFallback(shop(), apt());
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "disabled");
    assert.equal(await countCountedPushesThisMonth(SHOP_ID), 0);
  });
});
