import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calendarDaysUntil,
  computePlanState,
  SUBSCRIPTION_GRACE_DAYS,
} from "@/lib/billing/plan-state";

describe("computePlanState", () => {
  const now = new Date("2026-10-21T12:00:00.000Z");

  it("demo shops stay active", () => {
    const plan = computePlanState(
      {
        status: "active",
        subscribed_until: "2020-01-01T00:00:00.000Z",
        is_demo: true,
      },
      now,
    );
    assert.equal(plan.state, "active");
    assert.equal(plan.canBook, true);
  });

  it("trialing before expiry", () => {
    const plan = computePlanState(
      {
        status: "trialing",
        subscribed_until: "2026-11-01T00:00:00.000Z",
      },
      now,
    );
    assert.equal(plan.state, "trialing");
    assert.equal(plan.canBook, true);
  });

  it("grace within 3 days after expiry", () => {
    const until = new Date(now.getTime() - 1 * 86_400_000).toISOString();
    const plan = computePlanState(
      { status: "active", subscribed_until: until },
      now,
    );
    assert.equal(plan.state, "grace");
    assert.equal(plan.canBook, true);
    assert.equal(SUBSCRIPTION_GRACE_DAYS, 3);
  });

  it("expired after grace", () => {
    const until = new Date(
      now.getTime() - (SUBSCRIPTION_GRACE_DAYS + 1) * 86_400_000,
    ).toISOString();
    const plan = computePlanState(
      { status: "active", subscribed_until: until },
      now,
    );
    assert.equal(plan.state, "expired");
    assert.equal(plan.canBook, false);
    assert.equal(plan.canUseAdmin, false);
  });

  it("calendarDaysUntil rounds by UTC day", () => {
    const until = new Date("2026-10-28T23:00:00.000Z");
    assert.equal(calendarDaysUntil(until, now), 7);
  });
});
