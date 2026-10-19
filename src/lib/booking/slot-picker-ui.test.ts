import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstAvailableStartTime,
  partitionPastFutureSlots,
  summarizeAvailableSlots,
} from "@/lib/booking/slot-picker-ui";
import type { Slot } from "@/types/booking";

const slot = (start: string, available = true): Slot => ({
  startTime: start,
  endTime: start,
  available,
});

const NOW = new Date("2026-10-19T05:00:00.000Z"); // 12:00 Bangkok

describe("partitionPastFutureSlots", () => {
  it("splits past (start <= now) from future", () => {
    const slots = [
      slot("2026-10-19T03:00:00.000Z"), // past
      slot("2026-10-19T05:00:00.000Z"), // equal now → past
      slot("2026-10-19T05:30:00.000Z"), // future
      slot("2026-10-19T06:00:00.000Z", false), // future booked
    ];
    const { past, future } = partitionPastFutureSlots(slots, NOW);
    assert.deepEqual(
      past.map((s) => s.startTime),
      ["2026-10-19T03:00:00.000Z", "2026-10-19T05:00:00.000Z"],
    );
    assert.deepEqual(
      future.map((s) => s.startTime),
      ["2026-10-19T05:30:00.000Z", "2026-10-19T06:00:00.000Z"],
    );
  });

  it("preserves order within each partition", () => {
    const slots = [
      slot("2026-10-19T06:00:00.000Z"),
      slot("2026-10-19T04:00:00.000Z"),
      slot("2026-10-19T07:00:00.000Z"),
      slot("2026-10-19T03:00:00.000Z"),
    ];
    const { past, future } = partitionPastFutureSlots(slots, NOW);
    assert.deepEqual(
      past.map((s) => s.startTime),
      ["2026-10-19T04:00:00.000Z", "2026-10-19T03:00:00.000Z"],
    );
    assert.deepEqual(
      future.map((s) => s.startTime),
      ["2026-10-19T06:00:00.000Z", "2026-10-19T07:00:00.000Z"],
    );
  });

  it("returns empty partitions for empty input", () => {
    assert.deepEqual(partitionPastFutureSlots([], NOW), { past: [], future: [] });
  });
});

describe("summarizeAvailableSlots", () => {
  it("returns null when no available future slots", () => {
    assert.equal(
      summarizeAvailableSlots([slot("2026-10-19T06:00:00.000Z", false)]),
      null,
    );
    assert.equal(summarizeAvailableSlots([]), null);
  });

  it("counts available and picks earliest", () => {
    const summary = summarizeAvailableSlots([
      slot("2026-10-19T05:30:00.000Z", false),
      slot("2026-10-19T06:00:00.000Z", true),
      slot("2026-10-19T06:30:00.000Z", true),
    ]);
    assert.deepEqual(summary, {
      availableCount: 2,
      earliestStartTime: "2026-10-19T06:00:00.000Z",
    });
  });
});

describe("firstAvailableStartTime", () => {
  it("returns first available future start", () => {
    assert.equal(
      firstAvailableStartTime([
        slot("2026-10-19T05:30:00.000Z", false),
        slot("2026-10-19T06:00:00.000Z", true),
      ]),
      "2026-10-19T06:00:00.000Z",
    );
  });

  it("returns null when none available", () => {
    assert.equal(
      firstAvailableStartTime([slot("2026-10-19T06:00:00.000Z", false)]),
      null,
    );
  });
});
