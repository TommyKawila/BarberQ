import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTierBillingNoticeCopy,
  recommendedTierForBookableCount,
  shouldShowTierBillingNotice,
  shopTrialDayNumber,
  TIER_NOTICE_FROM_TRIAL_DAY,
} from "@/lib/billing/tier-notice";

describe("tier billing notice", () => {
  it("shows from trial day 25 onward", () => {
    const now = new Date("2026-10-22T12:00:00+07:00");
    const day24 = {
      created_at: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const day25 = {
      created_at: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    };
    assert.equal(shopTrialDayNumber(day24, now), 24);
    assert.equal(shouldShowTierBillingNotice(day24, now), false);
    assert.equal(shopTrialDayNumber(day25, now), 25);
    assert.equal(shouldShowTierBillingNotice(day25, now), true);
    assert.equal(TIER_NOTICE_FROM_TRIAL_DAY, 25);
  });

  it("recommends pack and builds Thai copy for 5 bookable seats", () => {
    assert.equal(recommendedTierForBookableCount(5), "tier2");
    const copy = buildTierBillingNoticeCopy(5);
    assert.match(copy.message, /ช่างรับคิว 5 คน/);
    assert.match(copy.message, /3–5 ช่าง/);
    assert.match(copy.message, /฿599/);
    assert.match(copy.message, /ไม่มีการตัดบัตรอัตโนมัติ/);
    assert.match(copy.message, /PromptPay/);
    assert.doesNotMatch(copy.message, /ไม่ต้องทำอะไรเพิ่ม/);
    assert.doesNotMatch(copy.message, /Tommy|ทักไป/);
  });

  it("maps 1–2 / 6–10 / 11+ correctly", () => {
    assert.equal(recommendedTierForBookableCount(1), "tier1");
    assert.equal(recommendedTierForBookableCount(2), "tier1");
    assert.equal(recommendedTierForBookableCount(6), "tier3");
    assert.equal(recommendedTierForBookableCount(11), "contact");
    const contact = buildTierBillingNoticeCopy(11);
    assert.match(contact.message, /มีคำถามทักเราได้/);
    assert.match(contact.message, /PromptPay/);
    assert.doesNotMatch(contact.message, /ไม่ต้องทำอะไรเพิ่ม/);
    assert.doesNotMatch(contact.message, /Tommy|ทักไป/);
  });
});
