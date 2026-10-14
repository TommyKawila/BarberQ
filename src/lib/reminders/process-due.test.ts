import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { processDueReminders } from "@/lib/reminders/process-due";
import {
  __resetReminderStoreForTests,
  __seedReminderForTests,
  claimReminderSend,
  getMemoryReminderSentAt,
} from "@/lib/reminders/reminder-store";
import {
  __resetLineMessageLogForTests,
  countCountedPushesThisMonth,
  recordLineMessage,
} from "@/lib/line/message-log";
import {
  __resetShopLineChannelsForTests,
  upsertShopLineChannel,
} from "@/lib/line/shop-channel";

const KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SHOP = "00000000-0000-0000-0000-000000000055";
const APPT = "00000000-0000-0000-0000-000000000066";

afterEach(() => {
  __resetReminderStoreForTests();
  __resetLineMessageLogForTests();
  __resetShopLineChannelsForTests();
  delete process.env.APP_ENCRYPTION_KEY;
});

function seedDue(overrides: Partial<Parameters<typeof __seedReminderForTests>[0]> = {}) {
  __seedReminderForTests({
    id: APPT,
    shop_id: SHOP,
    shop_slug: "demo",
    shop_name: "Demo",
    barber_id: "00000000-0000-0000-0000-000000000077",
    customer_name: "ลูกค้า",
    customer_line_id: "U-customer",
    start_time: "2030-06-01T12:00:00.000Z",
    end_time: "2030-06-01T12:30:00.000Z",
    status: "confirmed",
    source: "line",
    reminder_lead_minutes: 120,
    reminder_due_at: "2030-06-01T10:00:00.000Z",
    reminder_sent_at: null,
    ...overrides,
  });
}

describe("reminder idempotency", () => {
  it("claimReminderSend succeeds once then fails", async () => {
    seedDue();
    const now = new Date("2030-06-01T10:05:00.000Z");
    assert.equal(await claimReminderSend(APPT, now), true);
    assert.equal(await claimReminderSend(APPT, now), false);
    assert.ok(getMemoryReminderSentAt(APPT));
  });

  it("processDueReminders skips already-claimed rows on retry", async () => {
    process.env.APP_ENCRYPTION_KEY = KEY;
    await upsertShopLineChannel(SHOP, {
      messagingChannelId: "2000",
      channelSecret: "secret-value-xxxx",
      accessToken: "token-value-yyyy",
      monthlyPushBudget: 300,
      status: "verified",
    });
    seedDue();
    const now = new Date("2030-06-01T10:05:00.000Z");
    // Pre-claim as if a previous cron tick already sent
    assert.equal(await claimReminderSend(APPT, now), true);
    const result = await processDueReminders(now);
    assert.equal(result.scanned, 0);
    assert.equal(result.sent, 0);
  });
});

describe("reminder quota guard", () => {
  it("skips send at quota limit and keeps claim (no retry storm)", async () => {
    process.env.APP_ENCRYPTION_KEY = KEY;
    await upsertShopLineChannel(SHOP, {
      messagingChannelId: "2000",
      channelSecret: "secret-value-xxxx",
      accessToken: "token-value-yyyy",
      monthlyPushBudget: 1,
      status: "verified",
    });
    await recordLineMessage({ shopId: SHOP, kind: "push_cancel", counted: true });
    assert.equal(await countCountedPushesThisMonth(SHOP), 1);

    seedDue();
    const now = new Date("2030-06-01T10:05:00.000Z");
    const result = await processDueReminders(now);
    assert.equal(result.scanned, 1);
    assert.equal(result.sent, 0);
    assert.equal(result.quotaSkipped, 1);
    assert.ok(getMemoryReminderSentAt(APPT), "claimed so cron will not retry forever");
  });

  it("skips non-LINE sources without sending", async () => {
    seedDue({ source: "phone", customer_line_id: "" });
    // Non-LINE without line id is filtered from listDueReminders in memory mode
    const now = new Date("2030-06-01T10:05:00.000Z");
    const result = await processDueReminders(now);
    assert.equal(result.scanned, 0);
  });

  it("never sends when appointment start is already past; claims so no retry", async () => {
    // due_at fired (e.g. 2h lead) but cron/manual run happens after start
    seedDue({
      start_time: "2030-06-01T07:30:00.000Z", // 14:30 ICT
      end_time: "2030-06-01T08:00:00.000Z",
      reminder_due_at: "2030-06-01T05:30:00.000Z",
    });
    const now = new Date("2030-06-01T09:15:00.000Z"); // 16:15 ICT — after start
    const result = await processDueReminders(now);
    assert.equal(result.scanned, 1);
    assert.equal(result.sent, 0);
    assert.equal(result.skipped, 1);
    assert.ok(getMemoryReminderSentAt(APPT), "expired claim so cron will not retry");

    const again = await processDueReminders(now);
    assert.equal(again.scanned, 0);
    assert.equal(again.sent, 0);
  });
});
