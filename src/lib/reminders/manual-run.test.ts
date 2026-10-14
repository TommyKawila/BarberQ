import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canManuallyRunReminders } from "@/lib/reminders/manual-run";

describe("canManuallyRunReminders", () => {
  it("allows owners in every env", () => {
    assert.equal(canManuallyRunReminders("owner", "production"), true);
    assert.equal(canManuallyRunReminders("owner", "founder_qa"), true);
    assert.equal(canManuallyRunReminders("owner", "local"), true);
  });

  it("blocks non-owners in production", () => {
    assert.equal(canManuallyRunReminders("manager", "production"), false);
    assert.equal(canManuallyRunReminders("barber", "production"), false);
  });

  it("allows non-owners outside production", () => {
    assert.equal(canManuallyRunReminders("manager", "founder_qa"), true);
    assert.equal(canManuallyRunReminders("barber", "local"), true);
  });
});
