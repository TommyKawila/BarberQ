import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromZonedTime } from "date-fns-tz";
import {
  buildFreeStatusCopy,
  lateMinutesSinceStart,
  shopCloseHHmmForNow,
} from "@/lib/admin/free-status-copy";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";

const OPEN: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "10:30",
  close: "20:00",
}));

const labels = {
  untilNext: "ว่าง {n} นาที · ถัดไป {time}",
  untilCloseHours: "รับได้ถึง {time} (อีกประมาณ {n} ชม.)",
  untilCloseMinutes: "รับได้ถึง {time} (อีกประมาณ {n} นาที)",
};

describe("buildFreeStatusCopy", () => {
  it("uses until-next form when a next booking exists (never dumps close-gap minutes)", () => {
    const now = fromZonedTime("2026-11-02T11:02:00", SHOP_TIMEZONE);
    const next = fromZonedTime("2026-11-02T11:30:00", SHOP_TIMEZONE).toISOString();
    const closeGap = fromZonedTime("2026-11-02T20:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: closeGap,
      nextStartIso: next,
      shopCloseHHmm: "20:00",
      now,
      labels,
    });
    assert.equal(copy.mode, "until_next");
    assert.equal(copy.line, "ว่าง 28 นาที · ถัดไป 11:30");
    assert.doesNotMatch(copy.line, /659|รับได้ถึง/);
  });

  it("uses approximate hours until close when there is no next booking", () => {
    const now = fromZonedTime("2026-11-02T11:02:00", SHOP_TIMEZONE);
    const close = fromZonedTime("2026-11-02T20:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: close,
      nextStartIso: null,
      shopCloseHHmm: "20:00",
      now,
      labels,
    });
    assert.equal(copy.mode, "until_close");
    assert.match(copy.line, /รับได้ถึง 20:00 \(อีกประมาณ 9 ชม\.\)/);
    assert.doesNotMatch(copy.line, /ว่าง \d+ นาที/);
  });

  it("uses minutes when remaining until close is under 60", () => {
    const now = fromZonedTime("2026-11-02T19:25:00", SHOP_TIMEZONE);
    const close = fromZonedTime("2026-11-02T20:00:00", SHOP_TIMEZONE).toISOString();
    const copy = buildFreeStatusCopy({
      freeUntilIso: close,
      nextStartIso: null,
      shopCloseHHmm: "20:00",
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

describe("shopCloseHHmmForNow", () => {
  it("returns today's close", () => {
    const now = fromZonedTime("2026-11-02T11:00:00", SHOP_TIMEZONE);
    assert.equal(shopCloseHHmmForNow(OPEN, now), "20:00");
  });
});
