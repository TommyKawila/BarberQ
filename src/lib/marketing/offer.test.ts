import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fillOfferCopy,
  formatBaht,
  marketingOffer,
  resolveMarketingTierForBarberCount,
} from "@/lib/marketing/offer";

describe("marketingOffer single source of truth", () => {
  it("defines the owner-confirmed tier prices", () => {
    assert.equal(marketingOffer.tiers[0].monthlyPriceThb, 599);
    assert.equal(marketingOffer.tiers[0].minBarbers, 1);
    assert.equal(marketingOffer.tiers[0].maxBarbers, 5);
    assert.equal(marketingOffer.tiers[1].monthlyPriceThb, 999);
    assert.equal(marketingOffer.tiers[1].minBarbers, 6);
    assert.equal(marketingOffer.tiers[1].maxBarbers, 10);
    assert.equal(marketingOffer.contactFromBarbers, 11);
    assert.equal(marketingOffer.trialDays, 30);
    assert.equal(marketingOffer.lineFreePushQuota, 300);
  });

  it("resolves seat counts to tiers or contact", () => {
    assert.equal(resolveMarketingTierForBarberCount(0), null);
    const t3 = resolveMarketingTierForBarberCount(3);
    const t5 = resolveMarketingTierForBarberCount(5);
    const t6 = resolveMarketingTierForBarberCount(6);
    const t10 = resolveMarketingTierForBarberCount(10);
    assert.ok(t3 && t3 !== "contact");
    assert.ok(t5 && t5 !== "contact");
    assert.ok(t6 && t6 !== "contact");
    assert.ok(t10 && t10 !== "contact");
    assert.equal(t3.monthlyPriceThb, 599);
    assert.equal(t5.monthlyPriceThb, 599);
    assert.equal(t6.monthlyPriceThb, 999);
    assert.equal(t10.monthlyPriceThb, 999);
    assert.equal(resolveMarketingTierForBarberCount(11), "contact");
    assert.equal(resolveMarketingTierForBarberCount(20), "contact");
  });

  it("formats baht and offer copy placeholders", () => {
    assert.equal(formatBaht(599), "฿599");
    assert.equal(formatBaht(999), "฿999");
    assert.match(fillOfferCopy("{days}-day / {quota} msgs"), /30-day \/ 300 msgs/);
  });
});
