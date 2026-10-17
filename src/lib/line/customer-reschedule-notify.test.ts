import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getStore } from "@/lib/data";
import {
  notifyCustomerSelfRescheduleTicket,
  shouldSendCustomerRescheduleTicket,
} from "@/lib/line/customer-reschedule-notify";
import { buildCustomerRescheduleTicketFlex } from "@/lib/line/flex-messages";
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
const root = resolve(import.meta.dirname, "../..");

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
    id: "00000000-0000-0000-0000-000000000088",
    barber_id: "11111111-1111-4111-8111-111111111111",
    customer_ref: "U-customer",
    customer_name: "ลูกค้า",
    customer_phone: null,
    customer_line_id: "U-customer",
    start_time: "2030-06-01T13:00:00.000Z",
    end_time: "2030-06-01T13:30:00.000Z",
    status: "confirmed",
    source: "line",
    created_at: "2030-06-01T10:00:00.000Z",
    cancel_token: "tok",
    reschedule_count: 1,
    ...overrides,
  };
}

describe("customer self-reschedule LINE ticket", () => {
  it("gates on confirmed + customer_line_id", () => {
    assert.equal(
      shouldSendCustomerRescheduleTicket({
        status: "confirmed",
        customer_line_id: "U1",
      }),
      true,
    );
    assert.equal(
      shouldSendCustomerRescheduleTicket({
        status: "confirmed",
        customer_line_id: null,
      }),
      false,
    );
    assert.equal(
      shouldSendCustomerRescheduleTicket({
        status: "cancelled",
        customer_line_id: "U1",
      }),
      false,
    );
  });

  it("Flex shows new slot and struck-through เลื่อนจาก old time", () => {
    const flex = buildCustomerRescheduleTicketFlex({
      shopName: "PHINX",
      oldStartTime: "2030-06-01T12:00:00.000Z",
      oldEndTime: "2030-06-01T12:30:00.000Z",
      newStartTime: "2030-06-01T13:00:00.000Z",
      newEndTime: "2030-06-01T13:30:00.000Z",
      barberName: "นัท",
      myBookingsUrl: "https://example.com/bookings",
      cancelUrl: "https://example.com/c/tok",
    });
    const json = JSON.stringify(flex);
    assert.match(json, /เลื่อนคิวเรียบร้อยแล้ว/);
    assert.match(json, /เลื่อนจาก/);
    assert.match(json, /line-through/);
    assert.match(json, /นัท/);
    assert.match(json, /ยกเลิกนัด/);
    assert.match(flex.altText, /^✓ เลื่อนคิวแล้ว /);
  });

  it("skips without LINE id and uses no quota", async () => {
    const before = apt({
      start_time: "2030-06-01T12:00:00.000Z",
      end_time: "2030-06-01T12:30:00.000Z",
      reschedule_count: 0,
    });
    const after = apt({ customer_line_id: null });
    const result = await notifyCustomerSelfRescheduleTicket(shop(), before, after);
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "invalid_input");
    assert.equal(await countCountedPushesThisMonth(SHOP_ID), 0);
  });

  it("skips when bookingConfirmPushEnabled is OFF (no quota)", async () => {
    const store = getStore();
    const settings = await store.getShopSettings(SHOP_ID);
    await store.setShopSettings(SHOP_ID, {
      ...settings,
      bookingConfirmPushEnabled: false,
    });
    const before = apt({
      start_time: "2030-06-01T12:00:00.000Z",
      end_time: "2030-06-01T12:30:00.000Z",
      reschedule_count: 0,
    });
    const result = await notifyCustomerSelfRescheduleTicket(shop(), before, apt());
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "disabled");
    assert.equal(await countCountedPushesThisMonth(SHOP_ID), 0);
  });

  it("idempotent: skips when push_reschedule_ticket already succeeded", async () => {
    const after = apt();
    await recordLineMessage({
      shopId: SHOP_ID,
      kind: "push_reschedule_ticket",
      counted: true,
      appointmentId: after.id,
      success: true,
    });
    const before = apt({
      start_time: "2030-06-01T12:00:00.000Z",
      end_time: "2030-06-01T12:30:00.000Z",
      reschedule_count: 0,
    });
    const result = await notifyCustomerSelfRescheduleTicket(shop(), before, after);
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "already_delivered");
  });

  it("respects 300 quota guard", async () => {
    process.env.APP_ENCRYPTION_KEY = KEY;
    await upsertShopLineChannel(SHOP_ID, {
      messagingChannelId: "2000",
      channelSecret: "secret-value-xxxx",
      accessToken: "token-value-yyyy",
      monthlyPushBudget: 1,
      status: "verified",
    });
    await recordLineMessage({ shopId: SHOP_ID, kind: "push_cancel", counted: true });

    const before = apt({
      start_time: "2030-06-01T12:00:00.000Z",
      end_time: "2030-06-01T12:30:00.000Z",
      reschedule_count: 0,
    });
    const result = await notifyCustomerSelfRescheduleTicket(shop(), before, apt());
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "quota_full");
  });

  it("customer reschedule route fires ticket notify after commit", () => {
    const route = readFileSync(
      resolve(root, "app/api/reschedule/route.ts"),
      "utf8",
    );
    assert.match(route, /notifyCustomerSelfRescheduleTicket/);
    assert.match(route, /void notifyCustomerSelfRescheduleTicket/);
  });

  it("migration 0037 adds push_reschedule_ticket kind", () => {
    const sql = readFileSync(
      resolve(root, "../supabase/migrations/0037_push_reschedule_ticket_kind.sql"),
      "utf8",
    );
    assert.match(sql, /push_reschedule_ticket/);
    assert.doesNotMatch(sql, /0034_customer_reschedule/);
  });

  it("settings hint mentions reschedule tickets", () => {
    const dict = readFileSync(resolve(root, "lib/i18n/dictionary.ts"), "utf8");
    assert.match(dict, /admin\.confirmPushToggleHint[\s\S]*?เลื่อนคิวเอง/);
  });
});
