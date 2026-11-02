import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromZonedTime } from "date-fns-tz";
import {
  analyzePreOpen,
  shouldHideUnderPreOpenCollapse,
} from "@/lib/admin/pre-open-row";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn, AdminSlot } from "@/types/booking";

const HOURS: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "10:30",
  close: "20:00",
}));

const DAY = "2026-11-02";

function t(hm: string) {
  return fromZonedTime(`${DAY}T${hm}:00`, SHOP_TIMEZONE).toISOString();
}

function barber(id: string, name: string): AdminColumn["barber"] {
  return {
    id,
    name,
    slot_duration_minutes: 30,
    off_days: [],
    created_at: "",
    is_bookable: true,
    is_active: true,
    role: "barber",
  };
}

describe("analyzePreOpen", () => {
  it("collapses (allFree) when every pre-open slot is free", () => {
    const columns: AdminColumn[] = [
      {
        barber: barber("ken", "Ken"),
        slots: [
          { startTime: t("09:00"), endTime: t("09:30"), available: true, kind: "free" },
          { startTime: t("09:30"), endTime: t("10:00"), available: true, kind: "free" },
          { startTime: t("10:00"), endTime: t("10:30"), available: true, kind: "free" },
          { startTime: t("10:30"), endTime: t("11:00"), available: true, kind: "free" },
        ],
      },
    ];
    const pre = analyzePreOpen(columns, HOURS, DAY);
    assert.ok(pre);
    assert.equal(pre!.allFree, true);
    assert.equal(pre!.from, "09:00");
    assert.equal(pre!.to, "10:30");
    assert.equal(pre!.preOpenSlots.length, 3);
  });

  it("does not collapse when a booking exists before opening time", () => {
    const columns: AdminColumn[] = [
      {
        barber: barber("ken", "Ken"),
        slots: [
          { startTime: t("09:00"), endTime: t("09:30"), available: true, kind: "free" },
          {
            startTime: t("09:30"),
            endTime: t("10:00"),
            available: false,
            kind: "booked",
            customerName: "คุณเอ (ตัวอย่าง)",
            status: "confirmed",
            source: "line",
            appointmentId: "early-1",
          },
          { startTime: t("10:00"), endTime: t("10:30"), available: true, kind: "free" },
          { startTime: t("10:30"), endTime: t("11:00"), available: true, kind: "free" },
        ],
      },
    ];
    const pre = analyzePreOpen(columns, HOURS, DAY);
    assert.ok(pre);
    assert.equal(pre!.allFree, false);
    assert.equal(pre!.preOpenSlots.length, 3);
    // Booked pre-open slot must remain visible (not hidden)
    const booked = columns[0].slots[1];
    assert.equal(shouldHideUnderPreOpenCollapse(booked, pre, false), false);
    const freeEarly = columns[0].slots[0];
    assert.equal(shouldHideUnderPreOpenCollapse(freeEarly, pre, false), false);
  });

  it("hides free pre-open slots only when allFree and not expanded", () => {
    const free: AdminSlot = {
      startTime: t("09:00"),
      endTime: t("09:30"),
      available: true,
      kind: "free",
    };
    const pre = analyzePreOpen(
      [{ barber: barber("a", "A"), slots: [free] }],
      HOURS,
      DAY,
    );
    assert.ok(pre?.allFree);
    assert.equal(shouldHideUnderPreOpenCollapse(free, pre, false), true);
    assert.equal(shouldHideUnderPreOpenCollapse(free, pre, true), false);
  });
});
