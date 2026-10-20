import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeBoardMiniStats,
  describeWhoIsFreeEmpty,
  getBarberFreeNow,
  listFreeBarbersNow,
  nextShopOpenLabel,
} from "@/lib/admin/free-barbers";
import type { AdminColumn } from "@/types/booking";
import type { ShopHours } from "@/lib/shop/shop-hours";

function col(
  partial: Partial<AdminColumn> & { barber: AdminColumn["barber"]; slots: AdminColumn["slots"] },
): AdminColumn {
  return partial as AdminColumn;
}

const barber = (id: string, name: string) => ({
  id,
  name,
  slot_duration_minutes: 30,
  off_days: [] as number[],
  created_at: "",
  is_bookable: true,
  is_active: true,
});

describe("free-barbers helpers", () => {
  it("does not throw on null/malformed columns", () => {
    assert.deepEqual(listFreeBarbersNow(null), []);
    assert.deepEqual(listFreeBarbersNow(undefined), []);
    assert.deepEqual(
      listFreeBarbersNow([
        {
          barber: {
            id: "x",
            name: "X",
            slot_duration_minutes: 30,
            off_days: [],
            created_at: "",
          },
          slots: undefined as unknown as [],
        },
      ]),
      [],
    );
    assert.deepEqual(computeBoardMiniStats(null), { remaining: 0, done: 0, freeSlots: 0 });
  });

  it("lists free barbers with freeUntil through consecutive free slots", () => {
    const now = new Date("2026-10-12T05:00:00.000Z");
    const columns = [
      col({
        barber: barber("b1", "A"),
        slots: [
          {
            startTime: "2026-10-12T04:30:00.000Z",
            endTime: "2026-10-12T05:00:00.000Z",
            available: true,
            kind: "free",
          },
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:30:00.000Z",
            available: true,
            kind: "free",
          },
          {
            startTime: "2026-10-12T05:30:00.000Z",
            endTime: "2026-10-12T06:00:00.000Z",
            available: true,
            kind: "free",
          },
          {
            startTime: "2026-10-12T06:00:00.000Z",
            endTime: "2026-10-12T06:30:00.000Z",
            available: false,
            kind: "booked",
            status: "confirmed",
          },
        ],
      }),
    ];
    const free = listFreeBarbersNow(columns, now);
    assert.equal(free.length, 1);
    assert.equal(free[0].freeUntil, "2026-10-12T06:00:00.000Z");
  });

  it("treats covering free cell as free even when available:false (slot start passed)", () => {
    // Mirrors slot-service: past = start <= now → available false on the live free cell
    const now = new Date("2026-10-12T05:10:00.000Z");
    const columns = [
      col({
        barber: barber("ken", "Ken"),
        slots: [
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:30:00.000Z",
            available: false,
            kind: "free",
          },
          {
            startTime: "2026-10-12T05:30:00.000Z",
            endTime: "2026-10-12T06:00:00.000Z",
            available: true,
            kind: "free",
          },
          {
            startTime: "2026-10-12T06:00:00.000Z",
            endTime: "2026-10-12T06:30:00.000Z",
            available: true,
            kind: "free",
          },
        ],
      }),
    ];
    const free = listFreeBarbersNow(columns, now);
    assert.equal(free.length, 1, "WhoIsFree must list Ken when cards show ว่างตอนนี้");
    assert.equal(free[0].barberName, "Ken");
    assert.equal(free[0].freeUntil, "2026-10-12T06:30:00.000Z");
    assert.equal(free[0].slot.kind, "free");
    assert.equal(free[0].slot.available, true);
  });

  it("getBarberFreeNow matches listFreeBarbersNow for covering unavailable cell", () => {
    const now = new Date("2026-10-12T05:10:00.000Z");
    const column = col({
      barber: barber("peter", "Peter"),
      slots: [
        {
          startTime: "2026-10-12T05:00:00.000Z",
          endTime: "2026-10-12T05:30:00.000Z",
          available: false,
          kind: "free",
        },
        {
          startTime: "2026-10-12T05:30:00.000Z",
          endTime: "2026-10-12T16:30:00.000Z",
          available: true,
          kind: "free",
        },
      ],
    });
    const row = getBarberFreeNow(column, now);
    assert.ok(row);
    assert.equal(row!.freeUntil, "2026-10-12T16:30:00.000Z");
  });

  it("excludes barber who is currently cutting", () => {
    const now = new Date("2026-10-12T05:10:00.000Z");
    const columns = [
      col({
        barber: barber("busy", "Busy"),
        slots: [
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:30:00.000Z",
            available: false,
            kind: "booked",
            status: "confirmed",
            customerName: "C",
          },
        ],
      }),
    ];
    assert.equal(listFreeBarbersNow(columns, now).length, 0);
  });

  it("computes mini stats remaining/done/free", () => {
    const now = new Date("2026-10-12T05:00:00.000Z");
    const columns = [
      col({
        barber: barber("b1", "A"),
        slots: [
          {
            startTime: "2026-10-12T04:00:00.000Z",
            endTime: "2026-10-12T04:30:00.000Z",
            available: false,
            kind: "booked",
            status: "completed",
          },
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:30:00.000Z",
            available: false,
            kind: "booked",
            status: "confirmed",
          },
          {
            startTime: "2026-10-12T05:30:00.000Z",
            endTime: "2026-10-12T06:00:00.000Z",
            available: true,
            kind: "free",
          },
        ],
      }),
    ];
    const mini = computeBoardMiniStats(columns, now);
    assert.equal(mini.done, 1);
    assert.equal(mini.remaining, 1);
    assert.equal(mini.freeSlots, 1);
  });

  it("done counts only completed — not no_show or left; remaining still drops", () => {
    const now = new Date("2026-10-12T05:00:00.000Z");
    const columns = [
      col({
        barber: barber("b1", "A"),
        slots: [
          {
            startTime: "2026-10-12T03:00:00.000Z",
            endTime: "2026-10-12T03:30:00.000Z",
            available: false,
            kind: "booked",
            status: "no_show",
          },
          {
            startTime: "2026-10-12T03:30:00.000Z",
            endTime: "2026-10-12T04:00:00.000Z",
            available: false,
            kind: "booked",
            status: "left",
          },
          {
            startTime: "2026-10-12T04:00:00.000Z",
            endTime: "2026-10-12T04:30:00.000Z",
            available: false,
            kind: "booked",
            status: "completed",
          },
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:30:00.000Z",
            available: false,
            kind: "booked",
            status: "confirmed",
          },
        ],
      }),
    ];
    const mini = computeBoardMiniStats(columns, now);
    assert.equal(mini.done, 1);
    assert.equal(mini.remaining, 1);
  });

  it("describeWhoIsFreeEmpty reports closed with next open", () => {
    // Monday 2026-10-12 — Bangkok weekday; use hours closed after 18:00 Bangkok
    const hours: ShopHours = Array.from({ length: 7 }, () => ({
      closed: false,
      open: "10:00",
      close: "18:00",
    }));
    // 18:30 Bangkok = 11:30 UTC
    const now = new Date("2026-10-12T11:30:00.000Z");
    const empty = describeWhoIsFreeEmpty([], hours, now);
    assert.equal(empty.kind, "closed");
    assert.ok(empty.nextOpenLabel);
  });

  it("describeWhoIsFreeEmpty reports busy with next free time", () => {
    const hours: ShopHours = Array.from({ length: 7 }, () => ({
      closed: false,
      open: "00:00",
      close: "23:59",
    }));
    const now = new Date("2026-10-12T05:10:00.000Z");
    const columns = [
      col({
        barber: barber("busy", "Busy"),
        slots: [
          {
            startTime: "2026-10-12T05:00:00.000Z",
            endTime: "2026-10-12T05:45:00.000Z",
            available: false,
            kind: "booked",
            status: "confirmed",
          },
        ],
      }),
    ];
    const empty = describeWhoIsFreeEmpty(columns, hours, now);
    assert.equal(empty.kind, "busy");
    assert.equal(empty.nextFreeLabel, "12:45"); // Asia/Bangkok
  });

  it("nextShopOpenLabel skips closed days", () => {
    const hours: ShopHours = Array.from({ length: 7 }, (_, i) => ({
      closed: i !== 2, // only Wednesday open
      open: "10:30",
      close: "20:00",
    }));
    // Monday 2026-10-12 after close
    const now = new Date("2026-10-12T14:00:00.000Z");
    const label = nextShopOpenLabel(hours, now);
    assert.ok(label);
    assert.match(label!, /10:30/);
  });
});
