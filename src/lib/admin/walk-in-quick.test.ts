import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromZonedTime } from "date-fns-tz";
import {
  assessWalkInQuick,
  findNextFreeBoardSlot,
  walkInDisabledReason,
} from "@/lib/admin/walk-in-quick";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn } from "@/types/booking";
import type { ShopHours } from "@/lib/shop/shop-hours";

const QA_HOURS: ShopHours = [
  { closed: false, open: "10:00", close: "23:30" },
  { closed: false, open: "10:30", close: "23:30" },
  { closed: false, open: "10:30", close: "23:30" },
  { closed: false, open: "10:30", close: "23:30" },
  { closed: false, open: "10:30", close: "23:30" },
  { closed: false, open: "10:30", close: "23:30" },
  { closed: false, open: "10:00", close: "23:30" },
];

function col(
  partial: Partial<AdminColumn> & { barber: AdminColumn["barber"]; slots: AdminColumn["slots"] },
): AdminColumn {
  return partial as AdminColumn;
}

const barber = (id: string, name: string, offDays: number[] = []) => ({
  id,
  name,
  slot_duration_minutes: 30,
  off_days: offDays,
  created_at: "",
  is_bookable: true,
  is_active: true,
});

/** Monday 2026-10-20 — QA day Tommy hit (open 10:30). */
const beforeOpen = fromZonedTime("2026-10-20T08:23:00", SHOP_TIMEZONE);
const afterOpen = fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE);
const afterClose = fromZonedTime("2026-10-20T23:45:00", SHOP_TIMEZONE);

const openBoardSlots: AdminColumn["slots"] = [
  {
    startTime: fromZonedTime("2026-10-20T10:30:00", SHOP_TIMEZONE).toISOString(),
    endTime: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
    available: true,
    kind: "free",
  },
  {
    startTime: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
    endTime: fromZonedTime("2026-10-20T11:30:00", SHOP_TIMEZONE).toISOString(),
    available: true,
    kind: "free",
  },
  {
    startTime: fromZonedTime("2026-10-20T11:30:00", SHOP_TIMEZONE).toISOString(),
    endTime: fromZonedTime("2026-10-20T12:00:00", SHOP_TIMEZONE).toISOString(),
    available: true,
    kind: "free",
  },
];

describe("assessWalkInQuick", () => {
  it("before open (Tommy QA): board shows ว่าง but Walk-in is shop_before_open", () => {
    const column = col({
      barber: barber("ken", "Ken"),
      slots: openBoardSlots,
    });
    const result = assessWalkInQuick(column, QA_HOURS, beforeOpen);
    assert.equal(result.kind, "shop_before_open");
    if (result.kind === "shop_before_open") {
      assert.equal(result.openLabel, "10:30");
      assert.equal(result.barberName, "Ken");
    }
    const disabled = walkInDisabledReason(column, QA_HOURS, beforeOpen);
    assert.equal(disabled?.kind, "shop_before_open");
  });

  it("after close gates walk-in", () => {
    const column = col({
      barber: barber("ken", "Ken"),
      slots: openBoardSlots,
    });
    const result = assessWalkInQuick(column, QA_HOURS, afterClose);
    assert.equal(result.kind, "shop_after_close");
  });

  it("barber off day gates walk-in even with empty slots", () => {
    // 2026-10-20 is Tuesday (weekday 2)
    const duringOpen = fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE);
    const column = col({
      barber: barber("nick", "Nick", [2]),
      slots: [],
    });
    const result = assessWalkInQuick(column, QA_HOURS, duringOpen);
    assert.equal(result.kind, "barber_off");
  });

  it("during open hours with free covering slot → ok start-now", () => {
    const column = col({
      barber: barber("ken", "Ken"),
      slots: [
        {
          startTime: fromZonedTime("2026-10-20T10:30:00", SHOP_TIMEZONE).toISOString(),
          endTime: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
          available: false,
          kind: "free",
        },
        {
          startTime: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
          endTime: fromZonedTime("2026-10-20T11:30:00", SHOP_TIMEZONE).toISOString(),
          available: true,
          kind: "free",
        },
      ],
    });
    const result = assessWalkInQuick(column, QA_HOURS, afterOpen);
    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.fromOffer, false);
      assert.ok(Math.abs(new Date(result.startTime).getTime() - afterOpen.getTime()) < 1000);
    }
  });

  it("busy barber offers next free time; second assess with offer books that slot", () => {
    const busyEnd = fromZonedTime("2026-10-20T11:25:00", SHOP_TIMEZONE).toISOString();
    const nextStart = fromZonedTime("2026-10-20T11:30:00", SHOP_TIMEZONE).toISOString();
    const column = col({
      barber: barber("ken", "Ken"),
      slots: [
        {
          startTime: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
          endTime: busyEnd,
          available: false,
          kind: "booked",
          status: "confirmed",
          customerName: "Current",
          appointmentStart: fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
          appointmentEnd: busyEnd,
        },
        {
          startTime: nextStart,
          endTime: fromZonedTime("2026-10-20T12:00:00", SHOP_TIMEZONE).toISOString(),
          available: true,
          kind: "free",
        },
      ],
    });
    const first = assessWalkInQuick(column, QA_HOURS, afterOpen);
    assert.equal(first.kind, "busy");
    if (first.kind !== "busy") return;
    assert.equal(first.nextFreeLabel, "11:30");
    assert.equal(first.nextFreeStartTime, nextStart);

    const second = assessWalkInQuick(column, QA_HOURS, afterOpen, {
      barberId: "ken",
      startTime: first.nextFreeStartTime,
    });
    assert.equal(second.kind, "ok");
    if (second.kind === "ok") {
      assert.equal(second.startTime, nextStart);
      assert.equal(second.fromOffer, true);
    }
  });

  it("findNextFreeBoardSlot skips past and finds first available free", () => {
    const column = col({
      barber: barber("ken", "Ken"),
      slots: openBoardSlots,
    });
    const afterMs = fromZonedTime("2026-10-20T10:45:00", SHOP_TIMEZONE).getTime();
    const next = findNextFreeBoardSlot(column, afterMs);
    assert.ok(next);
    assert.equal(
      next!.startTime,
      fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString(),
    );
  });
});
