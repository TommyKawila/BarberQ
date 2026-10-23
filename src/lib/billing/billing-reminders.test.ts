import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBillingReminderText,
  billingPageUrl,
  processBillingReminders,
} from "@/lib/billing/billing-reminders";
import {
  __resetBillingReminderLogForTests,
  claimBillingReminderSend,
} from "@/lib/billing/reminder-log";
import { getStore } from "@/lib/data";

afterEach(() => {
  __resetBillingReminderLogForTests();
  delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("billing reminder copy", () => {
  it("day25 / due / overdue3 Thai copy — no auto-charge wording", () => {
    const url = "https://example.com/demo/admin/settings/billing";
    const day25 = buildBillingReminderText("day25", "Phinx", url);
    assert.match(day25, /ใกล้ครบกำหนด/);
    assert.match(day25, /PromptPay/);
    assert.match(day25, /ไม่มีการตัดบัตรอัตโนมัติ/);
    assert.equal(day25.includes("จะตัดบัตร"), false);
    assert.match(day25, /example\.com/);

    const due = buildBillingReminderText("due", "Phinx", url);
    assert.match(due, /วันนี้ครบกำหนด/);
    assert.match(due, /ไม่มีการตัดบัตรอัตโนมัติ/);

    const overdue = buildBillingReminderText("overdue3", "Phinx", url, 4);
    assert.match(overdue, /เลยกำหนดชำระมา 3 วัน/);
    assert.match(overdue, /ผ่อนผันเหลือ 4 วัน/);
    assert.match(overdue, /ไม่มีการตัดบัตรอัตโนมัติ/);
  });

  it("billing page URL uses shop slug", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    assert.equal(
      billingPageUrl("phinxstudio"),
      "https://app.example.com/phinxstudio/admin/settings/billing",
    );
  });
});

describe("billing reminder idempotency", () => {
  it("claim succeeds once then fails for same shop/kind/due", async () => {
    const input = {
      shopId: "00000000-0000-0000-0000-000000000001",
      kind: "day25" as const,
      dueAtKey: "2026-10-01",
      recipientLineId: "U-owner",
    };
    assert.equal(await claimBillingReminderSend(input), true);
    assert.equal(await claimBillingReminderSend(input), false);
  });

  it("processBillingReminders is safe with no LINE token", async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    // Use a fixed "now" that won't match seeded shop due dates → mostly skips
    const result = await processBillingReminders(
      new Date("2030-01-01T00:00:00.000Z"),
    );
    assert.ok(result.scanned >= 0);
    assert.equal(result.sent, 0);
  });

  it("memory store lists shops without throwing", async () => {
    const shops = await getStore().listShops();
    assert.ok(Array.isArray(shops));
  });
});
