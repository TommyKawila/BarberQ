import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  monthsForBillingPeriod,
  resolveBillingAmountForBookableCount,
  resolveBillingAmountForPeriod,
  yearlyAmountFromMonthly,
} from "@/lib/billing/billing-amount";
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

describe("yearly billing period (−20%)", () => {
  it("rounds monthly × 12 × 0.8 to whole baht and shows savings", () => {
    // 399 * 12 * 0.8 = 3830.4 → 3830
    assert.equal(yearlyAmountFromMonthly(399), 3830);
    assert.equal(yearlyAmountFromMonthly(599), 5750);
    assert.equal(yearlyAmountFromMonthly(999), 9590);

    const yearly = resolveBillingAmountForPeriod(3, "yearly");
    assert.equal(yearly.period, "yearly");
    assert.equal(yearly.monthlyAmountThb, 599);
    assert.equal(yearly.amountThb, 5750);
    assert.equal(yearly.yearlySavingsThb, 599 * 12 - 5750);
    assert.equal(yearly.priceLabel, "฿5,750");
    assert.equal(monthsForBillingPeriod("yearly"), 12);
    assert.equal(monthsForBillingPeriod("monthly"), 1);
  });

  it("monthly period keeps monthly amount", () => {
    const monthly = resolveBillingAmountForPeriod(2, "monthly");
    assert.equal(monthly.period, "monthly");
    assert.equal(monthly.amountThb, 399);
    assert.equal(monthly.yearlyAmountThb, 3830);
  });
});
