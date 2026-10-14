import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_REMINDER_CHIP_OPTIONS,
  defaultCustomerReminderChip,
  isCustomerReminderLeadFuture,
} from "@/lib/reminders/customer-chips";

describe("customer reminder chips", () => {
  const start = new Date("2030-06-01T12:00:00.000Z");

  it("exposes 1d / 3h / 1h / 30m / none (no 2h)", () => {
    assert.deepEqual([...CUSTOMER_REMINDER_CHIP_OPTIONS], [1440, 180, 60, 30, 0]);
  });

  it("marks past leads as not future", () => {
    const now = new Date("2030-06-01T11:40:00.000Z"); // 20 min before
    assert.equal(isCustomerReminderLeadFuture(60, start, now), false);
    assert.equal(isCustomerReminderLeadFuture(30, start, now), false);
    assert.equal(isCustomerReminderLeadFuture(0, start, now), true);
  });

  it("defaults shop 30 when still future", () => {
    const now = new Date("2030-06-01T10:00:00.000Z");
    assert.equal(defaultCustomerReminderChip(30, start, now), 30);
  });

  it("maps shop 2h default onto nearest still-future chip", () => {
    const now = new Date("2030-06-01T10:30:00.000Z"); // 90 min before — 2h past
    assert.equal(defaultCustomerReminderChip(120, start, now), 60);
  });

  it("falls back to none when nothing fits", () => {
    const now = new Date("2030-06-01T11:50:00.000Z");
    assert.equal(defaultCustomerReminderChip(30, start, now), 0);
  });
});
