import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addMinutes } from "date-fns";
import { cancelPageActions } from "@/lib/booking/cancel-page-actions";

const token = "tok-abc";

describe("cancelPageActions (/c/{token})", () => {
  it("allows reschedule + cancel when confirmed, token, count 0, ≥60 min", () => {
    const now = new Date("2030-06-01T10:00:00.000Z");
    const start = addMinutes(now, 120).toISOString();
    const a = cancelPageActions(
      {
        status: "confirmed",
        start_time: start,
        cancel_token: token,
        reschedule_count: 0,
      },
      now,
    );
    assert.equal(a.reschedulable, true);
    assert.equal(a.cancellable, true);
    assert.equal(a.rescheduleBlock, null);
  });

  it("blocks reschedule when already used once; cancel still ok if ≥60 min", () => {
    const now = new Date("2030-06-01T10:00:00.000Z");
    const start = addMinutes(now, 120).toISOString();
    const a = cancelPageActions(
      {
        status: "confirmed",
        start_time: start,
        cancel_token: token,
        reschedule_count: 1,
      },
      now,
    );
    assert.equal(a.reschedulable, false);
    assert.equal(a.cancellable, true);
    assert.equal(a.rescheduleBlock, "used");
  });

  it("blocks both when <60 min before start", () => {
    const now = new Date("2030-06-01T10:00:00.000Z");
    const start = addMinutes(now, 30).toISOString();
    const a = cancelPageActions(
      {
        status: "confirmed",
        start_time: start,
        cancel_token: token,
        reschedule_count: 0,
      },
      now,
    );
    assert.equal(a.reschedulable, false);
    assert.equal(a.cancellable, false);
    assert.equal(a.rescheduleBlock, "too_late");
  });

  it("blocks actions when cancelled", () => {
    const now = new Date("2030-06-01T10:00:00.000Z");
    const a = cancelPageActions(
      {
        status: "cancelled",
        start_time: addMinutes(now, 120).toISOString(),
        cancel_token: token,
        reschedule_count: 0,
      },
      now,
    );
    assert.equal(a.reschedulable, false);
    assert.equal(a.cancellable, false);
    assert.equal(a.rescheduleBlock, "not_confirmed");
  });
});
