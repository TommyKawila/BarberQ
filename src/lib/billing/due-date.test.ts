import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isBillingOverdue,
  nextSubscribedUntilAfterPayment,
  shopBillingDueAt,
  shopTrialEndsAt,
} from "@/lib/billing/due-date";

describe("billing due date", () => {
  const created = "2026-09-01T00:00:00.000Z";

  it("trial ends created_at + 30d", () => {
    const end = shopTrialEndsAt({ created_at: created });
    assert.equal(end.toISOString(), "2026-10-01T00:00:00.000Z");
  });

  it("due is trial end when unpaid", () => {
    const due = shopBillingDueAt({
      created_at: created,
      subscribed_until: null,
    });
    assert.equal(due.toISOString(), "2026-10-01T00:00:00.000Z");
  });

  it("due is subscribed_until when paid past trial", () => {
    const due = shopBillingDueAt({
      created_at: created,
      subscribed_until: "2026-11-01T00:00:00.000Z",
    });
    assert.equal(due.toISOString(), "2026-11-01T00:00:00.000Z");
  });

  it("marks overdue after trial when unpaid", () => {
    const now = new Date("2026-10-15T00:00:00.000Z");
    assert.equal(
      isBillingOverdue({ created_at: created, subscribed_until: null }, now),
      true,
    );
  });

  it("extends paid-through by 1 month from max(now, trial, current)", () => {
    const now = new Date("2026-10-05T00:00:00.000Z");
    const next = nextSubscribedUntilAfterPayment(
      { created_at: created, subscribed_until: null },
      now,
    );
    // base = max(now, trialEnd=Oct1) = Oct5 → +1 month
    assert.equal(next.getUTCMonth(), 10); // November
    assert.equal(next.getUTCDate(), 5);
  });
});
