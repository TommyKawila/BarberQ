import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeReminderSchedule,
  resolveReminderLeadMinutes,
} from "@/lib/reminders/resolve-lead";

describe("resolveReminderLeadMinutes", () => {
  const start = new Date("2030-06-01T12:00:00.000Z");

  it("returns preferred when still in the future", () => {
    const now = new Date("2030-06-01T08:00:00.000Z"); // 4h before
    assert.equal(resolveReminderLeadMinutes(180, start, now), 180);
  });

  it("falls back to nearest shorter preset still in the future", () => {
    // Preferred 1 day (1440) already passed; 3h and 2h also past; 1h still ok
    const now = new Date("2030-06-01T10:30:00.000Z"); // 90 min before
    assert.equal(resolveReminderLeadMinutes(1440, start, now), 60);
  });

  it("falls back to 30 minutes when only that remains", () => {
    const now = new Date("2030-06-01T11:20:00.000Z"); // 40 min before
    assert.equal(resolveReminderLeadMinutes(180, start, now), 30);
  });

  it("returns null when no preset is still in the future", () => {
    const now = new Date("2030-06-01T11:45:00.000Z"); // 15 min before
    assert.equal(resolveReminderLeadMinutes(60, start, now), null);
  });

  it("returns null for no-reminder preference", () => {
    const now = new Date("2030-06-01T08:00:00.000Z");
    assert.equal(resolveReminderLeadMinutes(null, start, now), null);
    assert.equal(resolveReminderLeadMinutes(0, start, now), null);
  });
});

describe("computeReminderSchedule", () => {
  it("sets dueAt = start - lead", () => {
    const start = new Date("2030-06-01T12:00:00.000Z");
    const now = new Date("2030-05-31T12:00:00.000Z");
    const schedule = computeReminderSchedule(120, start, now);
    assert.ok(schedule);
    assert.equal(schedule.leadMinutes, 120);
    assert.equal(schedule.dueAt.toISOString(), "2030-06-01T10:00:00.000Z");
  });
});
