import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  BREAK_WEEKDAYS_MON_FIRST,
  buildCreateBreakBody,
  validateBreakFormInput,
} from "@/lib/schedule/break-day-selector";

describe("break day selector UX", () => {
  it("uses Mon-first order with weekday values 1..6,0", () => {
    assert.deepEqual(
      BREAK_WEEKDAYS_MON_FIRST.map((day) => day.value),
      [1, 2, 3, 4, 5, 6, 0],
    );
  });

  it("Thai short labels match spec", () => {
    const labels = BREAK_WEEKDAYS_MON_FIRST.map((day) => dictionary.th[day.shortKey]);
    assert.deepEqual(labels, ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"]);
  });

  it("createBreak body uses selected weekday", () => {
    const body = buildCreateBreakBody({
      weekday: 3,
      startTime: "12:00",
      endTime: "13:00",
    });
    assert.deepEqual(body, { weekday: 3, startTime: "12:00", endTime: "13:00" });
  });

  it("form CTA copy is เพิ่มเวลาพัก", () => {
    assert.equal(dictionary.th["admin.addBreak"], "เพิ่มเวลาพัก");
  });

  it("blocks submit when weekday not selected", () => {
    assert.equal(
      validateBreakFormInput({ weekday: null, startTime: "12:00", endTime: "13:00" }),
      "selectDayRequired",
    );
  });

  it("blocks submit when start is not before end", () => {
    assert.equal(
      validateBreakFormInput({ weekday: 1, startTime: "14:00", endTime: "13:00" }),
      "invalidTime",
    );
  });
});
