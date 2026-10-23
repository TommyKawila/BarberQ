import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPastBillingGrace,
  isBillingOverdue,
} from "@/lib/billing/due-date";

describe("customer booking billing gate", () => {
  const unpaid = {
    created_at: "2026-09-01T00:00:00.000Z",
    subscribed_until: null as string | null,
  };

  it("allows bookings during grace (due+1..due+7)", () => {
    const day3 = new Date("2026-10-04T12:00:00.000Z");
    assert.equal(isBillingOverdue(unpaid, day3), true);
    assert.equal(isPastBillingGrace(unpaid, day3), false);
  });

  it("blocks new customer bookings after grace", () => {
    const after = new Date("2026-10-08T00:00:00.001Z");
    assert.equal(isPastBillingGrace(unpaid, after), true);
  });

  it("restores immediately when subscribed_until is extended", () => {
    const after = new Date("2026-10-20T00:00:00.000Z");
    const paid = {
      ...unpaid,
      subscribed_until: "2026-11-20T00:00:00.000Z",
    };
    assert.equal(isBillingOverdue(paid, after), false);
    assert.equal(isPastBillingGrace(paid, after), false);
  });
});
