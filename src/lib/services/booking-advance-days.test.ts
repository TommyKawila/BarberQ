import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BOOKING_WINDOW_DAYS,
  clampBookingAdvanceDays,
  DEFAULT_BOOKING_ADVANCE_DAYS,
  getBookableDates,
  MAX_BOOKING_ADVANCE_DAYS,
  MIN_BOOKING_ADVANCE_DAYS,
} from "@/lib/services/slot-service";

describe("booking advance days", () => {
  it("defaults to 30 (not the old hardcoded 7)", () => {
    assert.equal(DEFAULT_BOOKING_ADVANCE_DAYS, 30);
    assert.equal(BOOKING_WINDOW_DAYS, 30);
    assert.equal(getBookableDates(new Date("2026-10-23T05:00:00.000Z")).length, 30);
    assert.equal(getBookableDates(new Date("2026-10-23T05:00:00.000Z"))[0], "2026-10-23");
    assert.equal(getBookableDates(new Date("2026-10-23T05:00:00.000Z"))[29], "2026-11-21");
  });

  it("respects a custom advance window", () => {
    const dates = getBookableDates(new Date("2026-10-23T05:00:00.000Z"), 7);
    assert.equal(dates.length, 7);
    assert.equal(dates[6], "2026-10-29");
  });

  it("clamps invalid values", () => {
    assert.equal(clampBookingAdvanceDays(null), DEFAULT_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(0), MIN_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(999), MAX_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(14.6), 15);
  });

  it("ships migration + DateSelector picker for long windows", () => {
    const mig = readFileSync(
      resolve(process.cwd(), "supabase/migrations/0047_booking_advance_days.sql"),
      "utf8",
    );
    assert.match(mig, /booking_advance_days/);
    assert.match(mig, /default 30/);
    const selector = readFileSync(
      resolve(process.cwd(), "src/components/customer/DateSelector.tsx"),
      "utf8",
    );
    assert.match(selector, /pickOtherDate/);
    assert.match(selector, /type="date"/);
  });
});
