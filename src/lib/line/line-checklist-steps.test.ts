import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  hasMessagingApiKeys,
  resolveLineChecklistSteps,
} from "@/lib/line/line-checklist-steps";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

function channel(
  overrides: Partial<ShopLineChannelPublic> = {},
): ShopLineChannelPublic {
  return {
    shopId: "s1",
    messagingChannelId: null,
    channelSecretLast4: null,
    accessTokenLast4: null,
    botUserId: null,
    botDisplayName: null,
    oaBasicId: null,
    plan: "free",
    monthlyPushBudget: 300,
    status: "pending",
    lastVerifiedAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 1,
    autoReplyConfirmedAt: null,
    hasSecret: false,
    hasAccessToken: false,
    ...overrides,
  };
}

describe("resolveLineChecklistSteps", () => {
  it("keyless / null channel → Messaging API not done; step 1 active", () => {
    for (const input of [null, channel(), channel({ status: "broken", lastErrorCode: "MISSING_KEYS" })]) {
      const { currentStep, steps } = resolveLineChecklistSteps(input);
      assert.equal(currentStep, 1);
      assert.equal(steps[0].done, false);
      assert.equal(steps[0].active, true);
      assert.equal(steps[1].done, false);
      assert.equal(steps[2].done, false);
      assert.equal(steps[3].done, false);
      assert.equal(hasMessagingApiKeys(input), false);
    }
  });

  it("Channel ID or secret present → Messaging API done; webhook step active", () => {
    const withId = resolveLineChecklistSteps(
      channel({ messagingChannelId: "2000", checklistStep: 1 }),
    );
    assert.equal(withId.currentStep, 2);
    assert.equal(withId.steps[0].done, true);
    assert.equal(withId.steps[0].active, false);
    assert.equal(withId.steps[1].done, false);
    assert.equal(withId.steps[1].active, true);

    const withSecret = resolveLineChecklistSteps(
      channel({ hasSecret: true, checklistStep: 2 }),
    );
    assert.equal(withSecret.steps[0].done, true);
    assert.equal(withSecret.currentStep, 2);
  });

  it("auto-reply confirmed advances past step 3", () => {
    const prog = resolveLineChecklistSteps(
      channel({
        messagingChannelId: "2000",
        hasSecret: true,
        checklistStep: 3,
        autoReplyConfirmedAt: "2026-11-10T00:00:00.000Z",
      }),
    );
    assert.equal(prog.steps[0].done, true);
    assert.equal(prog.steps[1].done, true);
    assert.equal(prog.steps[2].done, true);
    assert.equal(prog.currentStep, 4);
    assert.equal(prog.steps[3].active, true);
  });

  it("LINE settings checklist uses resolveLineChecklistSteps (no hardcoded step1 done)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(src, /resolveLineChecklistSteps/);
    assert.doesNotMatch(src, /<Step n=\{1\} done /);
  });
});
