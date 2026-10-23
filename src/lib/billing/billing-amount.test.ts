import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveBillingAmountForBookableCount } from "@/lib/billing/billing-amount";
import { buildTierBillingNoticeCopy } from "@/lib/billing/tier-notice";

describe("resolveBillingAmountForBookableCount", () => {
  it("matches day-25 notice recommended pack for 3 bookable seats (not stale tier1)", () => {
    const billing = resolveBillingAmountForBookableCount(3);
    const notice = buildTierBillingNoticeCopy(3);
    assert.equal(billing.billingTier, "tier2");
    assert.equal(billing.amountThb, 599);
    assert.equal(billing.priceLabel, "฿599");
    assert.equal(billing.rangeLabel, "3–5 ช่าง");
    assert.equal(billing.billingTier, notice.recommendedTier);
    assert.equal(billing.priceLabel, notice.priceLabel);
    assert.equal(billing.rangeLabel, notice.rangeLabel);
  });

  it("maps 1–2 → tier1 ฿399, 6 → tier3 ฿999, 11+ → contact", () => {
    assert.deepEqual(
      {
        tier: resolveBillingAmountForBookableCount(2).billingTier,
        amount: resolveBillingAmountForBookableCount(2).amountThb,
      },
      { tier: "tier1", amount: 399 },
    );
    assert.equal(resolveBillingAmountForBookableCount(6).amountThb, 999);
    assert.equal(resolveBillingAmountForBookableCount(11).billingTier, "contact");
    assert.equal(resolveBillingAmountForBookableCount(11).amountThb, null);
  });
});
