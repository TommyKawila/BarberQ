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

  it("clamps invalid values (cap 1–30)", () => {
    assert.equal(MAX_BOOKING_ADVANCE_DAYS, 30);
    assert.equal(clampBookingAdvanceDays(null), DEFAULT_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(0), MIN_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(90), MAX_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(999), MAX_BOOKING_ADVANCE_DAYS);
    assert.equal(clampBookingAdvanceDays(14.6), 15);
  });

  it("ships migration 0050 + DateSelector picker for long windows", () => {
    const mig = readFileSync(
      resolve(process.cwd(), "supabase/migrations/0050_booking_advance_days.sql"),
      "utf8",
    );
    assert.match(mig, /booking_advance_days/);
    assert.match(mig, /default 30/);
    assert.match(mig, /booking_advance_days <= 30/);
    assert.match(mig, /drop constraint if exists shop_settings_booking_advance_days_check/);
    assert.match(mig, /booking_advance_days > 30/);
    const catchup = readFileSync(
      resolve(process.cwd(), "supabase/scripts/prod_catchup_0050_booking_advance_days.sql"),
      "utf8",
    );
    assert.match(catchup, /booking_advance_days <= 30/);
    assert.match(catchup, /drop constraint if exists shop_settings_booking_advance_days_check/);
    const selector = readFileSync(
      resolve(process.cwd(), "src/components/customer/DateSelector.tsx"),
      "utf8",
    );
    assert.match(selector, /pickOtherDate/);
    // iOS LINE ignores <input type="date" min/max> — custom calendar only.
    assert.doesNotMatch(selector, /type=["']date["']/);
    assert.match(selector, /booking-date-calendar/);
    assert.match(selector, /bookableSet/);
    assert.match(selector, /resolveSafeDate/);
  });

  it("degrades safely when booking_advance_days column is missing", () => {
    const store = readFileSync(
      resolve(process.cwd(), "src/lib/data/supabase-store.ts"),
      "utf8",
    );
    // SELECT falls back on Postgres undefined_column (42703) / column name in message
    assert.match(store, /missingAdvance/);
    assert.match(store, /42703/);
    assert.match(store, /booking_advance_days/);
    // Returned settings use DEFAULT_BOOKING_ADVANCE_DAYS when column absent
    assert.match(
      store,
      /bookingAdvanceDays = clampBookingAdvanceDays\(\s*data\?\.booking_advance_days \?\? DEFAULT_BOOKING_ADVANCE_DAYS/,
    );
    // UPSERT strips the column and retries if DB rejects it
    assert.match(store, /delete payload\.booking_advance_days/);
  });
});
