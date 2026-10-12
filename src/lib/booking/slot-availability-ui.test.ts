import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mergeSlotsCache,
  reconcileSelectedStart,
  shouldApplySlotResponse,
  slotAvailabilityKey,
  slotsDisplayLoading,
  slotsForDisplay,
} from "@/lib/booking/slot-availability-ui";
import type { Slot } from "@/types/booking";

const slot = (start: string, available = true): Slot => ({
  startTime: start,
  endTime: start,
  available,
});

describe("slotAvailabilityKey", () => {
  it("joins barber and date", () => {
    assert.equal(slotAvailabilityKey("b1", "2026-10-13"), "b1|2026-10-13");
  });
});

describe("shouldApplySlotResponse", () => {
  it("rejects stale responses after barber/date switch", () => {
    assert.equal(shouldApplySlotResponse("a|2026-10-13", "b|2026-10-13"), false);
    assert.equal(shouldApplySlotResponse("a|2026-10-13", null), false);
    assert.equal(shouldApplySlotResponse("b|2026-10-13", "b|2026-10-13"), true);
  });
});

describe("slotsForDisplay", () => {
  it("never shows previous barber slots when ownership mismatches", () => {
    const prev = [slot("2026-10-13T04:00:00.000Z")];
    const shown = slotsForDisplay({
      desiredKey: "peter|2026-10-13",
      ownerKey: "ken|2026-10-13",
      slots: prev,
      cache: new Map(),
    });
    assert.deepEqual(shown, []);
  });

  it("uses cache for instant switch when prefetched", () => {
    const cached = [slot("2026-10-13T04:30:00.000Z")];
    const cache = new Map([["peter|2026-10-13", cached]]);
    const shown = slotsForDisplay({
      desiredKey: "peter|2026-10-13",
      ownerKey: "ken|2026-10-13",
      slots: [slot("2026-10-13T04:00:00.000Z")],
      cache,
    });
    assert.equal(shown, cached);
  });

  it("uses in-state slots when ownership matches", () => {
    const current = [slot("2026-10-13T05:00:00.000Z")];
    const shown = slotsForDisplay({
      desiredKey: "peter|2026-10-13",
      ownerKey: "peter|2026-10-13",
      slots: current,
      cache: new Map(),
    });
    assert.equal(shown, current);
  });
});

describe("slotsDisplayLoading", () => {
  it("shows skeleton only when desired key has no trusted data", () => {
    assert.equal(
      slotsDisplayLoading({
        desiredKey: "peter|2026-10-13",
        ownerKey: "ken|2026-10-13",
        slotsLoading: false,
        cache: new Map(),
      }),
      true,
    );
    assert.equal(
      slotsDisplayLoading({
        desiredKey: "peter|2026-10-13",
        ownerKey: "ken|2026-10-13",
        slotsLoading: false,
        cache: new Map([["peter|2026-10-13", []]]),
      }),
      false,
    );
    assert.equal(
      slotsDisplayLoading({
        desiredKey: "peter|2026-10-13",
        ownerKey: "peter|2026-10-13",
        slotsLoading: true,
        cache: new Map(),
      }),
      true,
    );
  });
});

describe("reconcileSelectedStart", () => {
  it("clears selection when slot missing or unavailable for new barber", () => {
    const start = "2026-10-13T04:00:00.000Z";
    assert.equal(reconcileSelectedStart(start, [slot(start, false)]), null);
    assert.equal(reconcileSelectedStart(start, [slot("2026-10-13T04:30:00.000Z")]), null);
    assert.equal(reconcileSelectedStart(start, [slot(start, true)]), start);
    assert.equal(reconcileSelectedStart(null, [slot(start)]), null);
  });
});

describe("mergeSlotsCache", () => {
  it("writes each barber under date-scoped keys", () => {
    const cache = new Map<string, Slot[]>();
    const peter = [slot("2026-10-13T04:00:00.000Z")];
    mergeSlotsCache(cache, "2026-10-13", { peter, ken: [] });
    assert.equal(cache.get("peter|2026-10-13"), peter);
    assert.deepEqual(cache.get("ken|2026-10-13"), []);
  });
});

describe("BookingApp stale-slot guards (source)", () => {
  it("wires race key, cache merge, and display helpers", () => {
    const app = readFileSync(
      resolve(import.meta.dirname, "../../components/customer/BookingApp.tsx"),
      "utf8",
    );
    assert.match(app, /slotAvailabilityKey/);
    assert.match(app, /shouldApplySlotResponse/);
    assert.match(app, /slotsForDisplay/);
    assert.match(app, /slotsDisplayLoading/);
    assert.match(app, /reconcileSelectedStart/);
    assert.match(app, /mergeSlotsCache/);
    assert.match(app, /AbortController/);
    assert.match(app, /slots\?date=/);
  });
});
