import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BILLING_GRACE_DAYS,
  billingDaysFromDue,
  graceDaysRemaining,
  isBillingOverdue,
  isPastBillingGrace,
  nextSubscribedUntilAfterPayment,
  resolveBillingReminderKind,
  shopBillingDueAt,
  shopBillingGraceEndsAt,
  shopTrialEndsAt,
} from "@/lib/billing/due-date";

describe("billing due date", () => {
  const created = "2026-09-01T00:00:00.000Z";
  const shop = { created_at: created, subscribed_until: null as string | null };

  it("trial ends created_at + 30d", () => {
    const end = shopTrialEndsAt({ created_at: created });
    assert.equal(end.toISOString(), "2026-10-01T00:00:00.000Z");
  });

  it("due is trial end when unpaid", () => {
    const due = shopBillingDueAt(shop);
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
    assert.equal(isBillingOverdue(shop, now), true);
  });

  it("extends paid-through by 1 month from max(now, trial, current)", () => {
    const now = new Date("2026-10-05T00:00:00.000Z");
    const next = nextSubscribedUntilAfterPayment(shop, now);
    // base = max(now, trialEnd=Oct1) = Oct5 → +1 month
    assert.equal(next.getUTCMonth(), 10); // November
    assert.equal(next.getUTCDate(), 5);
  });

  it("grace ends 7 days after due", () => {
    const end = shopBillingGraceEndsAt(shop);
    assert.equal(end.toISOString(), "2026-10-08T00:00:00.000Z");
    assert.equal(BILLING_GRACE_DAYS, 7);
  });

  it("grace days remaining during overdue window", () => {
    const day2 = new Date("2026-10-03T12:00:00.000Z");
    assert.equal(graceDaysRemaining(shop, day2), 5);
    assert.equal(isPastBillingGrace(shop, day2), false);
  });

  it("past grace blocks after due+7", () => {
    const after = new Date("2026-10-08T00:00:00.001Z");
    assert.equal(isPastBillingGrace(shop, after), true);
    assert.equal(graceDaysRemaining(shop, after), 0);
  });

  it("reminder kinds: day25 / due / overdue3", () => {
    assert.equal(
      resolveBillingReminderKind(shop, new Date("2026-09-26T12:00:00.000Z")),
      "day25",
    );
    assert.equal(billingDaysFromDue(shop, new Date("2026-09-26T12:00:00.000Z")), -5);
    assert.equal(
      resolveBillingReminderKind(shop, new Date("2026-10-01T08:00:00.000Z")),
      "due",
    );
    assert.equal(
      resolveBillingReminderKind(shop, new Date("2026-10-04T08:00:00.000Z")),
      "overdue3",
    );
    assert.equal(
      resolveBillingReminderKind(shop, new Date("2026-09-20T12:00:00.000Z")),
      null,
    );
  });

  it("paying (subscribed_until past now) clears overdue and grace block", () => {
    const now = new Date("2026-10-20T00:00:00.000Z");
    const paid = {
      created_at: created,
      subscribed_until: "2026-11-20T00:00:00.000Z",
    };
    assert.equal(isBillingOverdue(paid, now), false);
    assert.equal(isPastBillingGrace(paid, now), false);
  });

  it("yearly payment extends subscribed_until by 12 months", () => {
    const now = new Date("2026-10-05T00:00:00.000Z");
    const next = nextSubscribedUntilAfterPayment(shop, now, 12);
    assert.equal(next.toISOString(), "2027-10-05T00:00:00.000Z");
  });
});
