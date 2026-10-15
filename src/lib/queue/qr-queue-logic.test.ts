import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aheadCount,
  estimateWaitMinutes,
  pickFirstAvailableBarber,
  queuePosition,
  shouldNotifyQueueAhead,
  sortWaitingByJoinOrder,
  type QrQueueEntryLike,
} from "@/lib/queue/qr-queue-logic";

function entry(
  id: string,
  created_at: string,
  status: QrQueueEntryLike["status"] = "waiting",
): QrQueueEntryLike {
  return { id, created_at, status };
}

describe("qr-queue ordering", () => {
  it("orders waiting FIFO by created_at", () => {
    const rows = [
      entry("c", "2026-10-15T10:02:00.000Z"),
      entry("a", "2026-10-15T10:00:00.000Z"),
      entry("b", "2026-10-15T10:01:00.000Z"),
      entry("x", "2026-10-15T09:00:00.000Z", "started"),
    ];
    const ordered = sortWaitingByJoinOrder(rows);
    assert.deepEqual(
      ordered.map((e) => e.id),
      ["a", "b", "c"],
    );
  });

  it("assigns positions 1/2/3 and updates after front is removed", () => {
    const waiting = [
      entry("a", "2026-10-15T10:00:00.000Z"),
      entry("b", "2026-10-15T10:01:00.000Z"),
      entry("c", "2026-10-15T10:02:00.000Z"),
    ];
    assert.equal(queuePosition("a", waiting), 1);
    assert.equal(queuePosition("b", waiting), 2);
    assert.equal(queuePosition("c", waiting), 3);
    assert.equal(aheadCount(queuePosition("c", waiting)), 2);

    const afterCall = waiting.filter((e) => e.id !== "a");
    assert.equal(queuePosition("b", afterCall), 1);
    assert.equal(queuePosition("c", afterCall), 2);
    assert.equal(aheadCount(queuePosition("c", afterCall)), 1);
  });

  it("triggers ahead push only when exactly 2 ahead", () => {
    assert.equal(shouldNotifyQueueAhead(2), true);
    assert.equal(shouldNotifyQueueAhead(1), false);
    assert.equal(shouldNotifyQueueAhead(3), false);
    assert.equal(shouldNotifyQueueAhead(0), false);
  });

  it("estimates wait from ahead × slot", () => {
    assert.equal(estimateWaitMinutes(2, 30), 60);
    assert.equal(estimateWaitMinutes(0, 30), 0);
  });
});

describe("first-available assignment", () => {
  it("picks free-now barber with longest free stretch", () => {
    const now = new Date("2026-10-15T10:00:00.000Z");
    const id = pickFirstAvailableBarber(
      [
        {
          barberId: "short",
          freeUntil: "2026-10-15T10:20:00.000Z",
          nextFreeAt: null,
        },
        {
          barberId: "long",
          freeUntil: "2026-10-15T11:00:00.000Z",
          nextFreeAt: null,
        },
        {
          barberId: "busy",
          freeUntil: null,
          nextFreeAt: "2026-10-15T10:45:00.000Z",
        },
      ],
      now,
    );
    assert.equal(id, "long");
  });

  it("falls back to soonest nextFreeAt when nobody is free now", () => {
    const now = new Date("2026-10-15T10:00:00.000Z");
    const id = pickFirstAvailableBarber(
      [
        {
          barberId: "later",
          freeUntil: null,
          nextFreeAt: "2026-10-15T11:00:00.000Z",
        },
        {
          barberId: "sooner",
          freeUntil: null,
          nextFreeAt: "2026-10-15T10:30:00.000Z",
        },
      ],
      now,
    );
    assert.equal(id, "sooner");
  });

  it("returns null when no candidates are usable", () => {
    assert.equal(pickFirstAvailableBarber([]), null);
    assert.equal(
      pickFirstAvailableBarber([
        { barberId: "x", freeUntil: null, nextFreeAt: null },
      ]),
      null,
    );
  });
});
