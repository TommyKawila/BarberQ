import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromZonedTime } from "date-fns-tz";
import {
  buildFreeStatusCopy,
  lateMinutesSinceStart,
} from "@/lib/admin/free-status-copy";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";

const labels = {
  untilNext: "ว่าง {n} นาที · ถัดไป {time}",
  untilCloseHours: "รับได้ถึง {time} (อีกประมาณ {n} ชม.)",
  untilCloseMinutes: "รับได้ถึง {time} (อีกประมาณ {n} นาที)",
};

describe("buildFreeStatusCopy", () => {
  it("uses until-next form when a next booking exists (never dumps close-gap minutes)", () => {
    const now = fromZonedTime("2026-11-02T11:02:00", SHOP_TIMEZONE);
    const next = fromZonedTime("2026-11-02T11:30:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: next,
      nextStartIso: next,
      now,
      labels,
    });
    assert.equal(copy.mode, "until_next");
    assert.equal(copy.line, "ว่าง 28 นาที · ถัดไป 11:30");
    assert.doesNotMatch(copy.line, /659|รับได้ถึง/);
  });

  it("counts free minutes with min(freeUntil, nextStart) when a break is before next", () => {
    const now = fromZonedTime("2026-11-02T11:00:00", SHOP_TIMEZONE);
    const freeUntil = fromZonedTime("2026-11-02T12:00:00", SHOP_TIMEZONE).toISOString();
    const next = fromZonedTime("2026-11-02T14:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: freeUntil,
      nextStartIso: next,
      now,
      labels,
    });
    assert.equal(copy.mode, "until_next");
    assert.equal(copy.line, "ว่าง 60 นาที · ถัดไป 14:00");
    assert.doesNotMatch(copy.line, /ว่าง 180/);
  });

  it("uses freeUntil time (not shop close) when there is no next booking", () => {
    const now = fromZonedTime("2026-11-02T11:00:00", SHOP_TIMEZONE);
    const freeUntil = fromZonedTime("2026-11-02T12:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: freeUntil,
      nextStartIso: null,
      now,
      labels,
    });
    assert.equal(copy.mode, "until_close");
    assert.match(copy.line, /รับได้ถึง 12:00 \(อีกประมาณ 1 ชม\.\)/);
    assert.doesNotMatch(copy.line, /20:00/);
  });

  it("uses approximate hours until freeUntil when remaining >= 60", () => {
    const now = fromZonedTime("2026-11-02T11:02:00", SHOP_TIMEZONE);
    const freeUntil = fromZonedTime("2026-11-02T20:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: freeUntil,
      nextStartIso: null,
      now,
      labels,
    });
    assert.equal(copy.mode, "until_close");
    assert.match(copy.line, /รับได้ถึง 20:00 \(อีกประมาณ 9 ชม\.\)/);
    assert.doesNotMatch(copy.line, /ว่าง \d+ นาที/);
  });

  it("uses minutes when remaining until freeUntil is under 60", () => {
    const now = fromZonedTime("2026-11-02T19:25:00", SHOP_TIMEZONE);
    const freeUntil = fromZonedTime("2026-11-02T20:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: freeUntil,
      nextStartIso: null,
      now,
      labels,
    });
    assert.equal(copy.mode, "until_close");
    assert.match(copy.line, /รับได้ถึง 20:00 \(อีกประมาณ 35 นาที\)/);
  });
});

describe("lateMinutesSinceStart", () => {
  it("counts whole minutes past start", () => {
    const start = fromZonedTime("2026-11-02T11:00:00", SHOP_TIMEZONE).toISOString();
    const now = fromZonedTime("2026-11-02T11:05:00", SHOP_TIMEZONE);
    assert.equal(lateMinutesSinceStart(start, now), 5);
  });

  it("is zero before start", () => {
    const start = fromZonedTime("2026-11-02T11:00:00", SHOP_TIMEZONE).toISOString();
    const now = fromZonedTime("2026-11-02T10:55:00", SHOP_TIMEZONE);
    assert.equal(lateMinutesSinceStart(start, now), 0);
  });
});
