import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";
import {
  applyDefaultHoursToSelectedDays,
  HOURS_PRESET_ALL_DAYS,
  HOURS_PRESET_MON_FRI,
  HOURS_PRESET_MON_SAT,
} from "@/lib/onboarding/setup-hours";

function cloneHours() {
  return DEFAULT_SHOP_HOURS.map((d) => ({ ...d }));
}

describe("applyDefaultHoursToSelectedDays", () => {
  it("does not use Sunday as implicit source when Monday is edited first", () => {
    const hours = cloneHours();
    hours[1] = { closed: false, open: "11:00", close: "18:00" };
    const result = applyDefaultHoursToSelectedDays(hours, [1], "10:00", "19:00");
    assert.equal(result[1].open, "10:00");
    assert.equal(result[1].close, "19:00");
    assert.equal(result[0].open, DEFAULT_SHOP_HOURS[0].open);
  });

  it("updates only selected days", () => {
    const hours = cloneHours();
    hours[2] = { closed: false, open: "12:00", close: "17:00" };
    const result = applyDefaultHoursToSelectedDays(hours, [1, 3], "09:00", "21:00");
    assert.equal(result[1].open, "09:00");
    assert.equal(result[3].open, "09:00");
    assert.equal(result[2].open, "12:00");
  });

  it("leaves unselected custom day unchanged", () => {
    const hours = cloneHours();
    hours[4] = { closed: false, open: "08:30", close: "16:30" };
    const result = applyDefaultHoursToSelectedDays(hours, [1], "10:00", "19:00");
    assert.equal(result[4].open, "08:30");
    assert.equal(result[4].close, "16:30");
  });

  it("leaves unselected closed day closed", () => {
    const hours = cloneHours();
    hours[0] = { closed: true, open: "10:00", close: "20:00" };
    const result = applyDefaultHoursToSelectedDays(hours, [1], "10:00", "19:00");
    assert.equal(result[0].closed, true);
  });

  it("opens selected days that were closed", () => {
    const hours = cloneHours();
    hours[6] = { closed: true, open: "10:00", close: "20:00" };
    const result = applyDefaultHoursToSelectedDays(hours, [6], "10:00", "19:00");
    assert.equal(result[6].closed, false);
    assert.equal(result[6].open, "10:00");
    assert.equal(result[6].close, "19:00");
  });

  it("Mon-Fri preset indexes", () => {
    assert.deepEqual(HOURS_PRESET_MON_FRI, [1, 2, 3, 4, 5]);
  });

  it("Mon-Sat preset indexes", () => {
    assert.deepEqual(HOURS_PRESET_MON_SAT, [1, 2, 3, 4, 5, 6]);
  });

  it("all-days preset indexes", () => {
    assert.deepEqual(HOURS_PRESET_ALL_DAYS, [0, 1, 2, 3, 4, 5, 6]);
  });
});
