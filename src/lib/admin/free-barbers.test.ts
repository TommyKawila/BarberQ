import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeBoardMiniStats, listFreeBarbersNow } from "@/lib/admin/free-barbers";
import type { AdminColumn } from "@/types/booking";

function col(partial: Partial<AdminColumn> & { barber: AdminColumn["barber"]; slots: AdminColumn["slots"] }): AdminColumn {
  return partial as AdminColumn;
}

describe("free-barbers helpers", () => {
  it("does not throw on null/malformed columns", () => {
    assert.deepEqual(listFreeBarbersNow(null), []);
    assert.deepEqual(listFreeBarbersNow(undefined), []);
    assert.deepEqual(listFreeBarbersNow([{ barber: { id: "x", name: "X", slot_duration_minutes: 30, off_days: [], created_at: "" }, slots: undefined as unknown as [] }]), []);
    assert.deepEqual(computeBoardMiniStats(null), { remaining: 0, done: 0, freeSlots: 0 });
    assert.deepEqual(computeBoardMiniStats([{ barber: { id: "x", name: "X", slot_duration_minutes: 30, off_days: [], created_at: "" }, slots: undefined as unknown as [] }]), {
      remaining: 0,
      done: 0,
      freeSlots: 0,
    });
  });

  it("lists free barbers with freeUntil through consecutive free slots", () => {
    const now = new Date("2026-10-12T05:00:00.000Z");
    const columns = [
      col({
        barber: {
          id: "b1",
          name: "A",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: now.toISOString(),
        },
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

  it("computes mini stats remaining/done/free", () => {
    const now = new Date("2026-10-12T05:00:00.000Z");
    const columns = [
      col({
        barber: {
          id: "b1",
          name: "A",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: now.toISOString(),
        },
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
        barber: {
          id: "b1",
          name: "A",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: now.toISOString(),
        },
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
});
