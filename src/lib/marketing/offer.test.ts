import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fillOfferCopy,
  formatBaht,
  marketingClaims,
  marketingOffer,
  resolveMarketingTierForBarberCount,
  tierBarberRangeLabel,
  tierPerDayHint,
} from "@/lib/marketing/offer";

describe("marketingOffer single source of truth", () => {
  it("defines the owner-confirmed three-tier prices", () => {
    assert.equal(marketingOffer.tiers.length, 3);
    assert.equal(marketingOffer.tiers[0].monthlyPriceThb, 399);
    assert.equal(marketingOffer.tiers[0].minBarbers, 1);
    assert.equal(marketingOffer.tiers[0].maxBarbers, 2);
    assert.equal(marketingOffer.tiers[1].monthlyPriceThb, 599);
    assert.equal(marketingOffer.tiers[1].minBarbers, 3);
    assert.equal(marketingOffer.tiers[1].maxBarbers, 5);
    assert.equal(marketingOffer.tiers[2].monthlyPriceThb, 999);
    assert.equal(marketingOffer.tiers[2].minBarbers, 6);
    assert.equal(marketingOffer.tiers[2].maxBarbers, 10);
    assert.equal(marketingOffer.contactFromBarbers, 11);
    assert.equal(marketingOffer.trialDays, 30);
    assert.equal(marketingOffer.lineFreePushQuota, 300);
  });

  it("defaults short-lead and self-reschedule claims on (flags remain toggleable)", () => {
    assert.equal(marketingClaims.reminderShortLeads, true);
    assert.equal(marketingClaims.customerSelfReschedule, true);
  });

  it("resolves seat counts to tiers or contact", () => {
    assert.equal(resolveMarketingTierForBarberCount(0), null);
    const t1 = resolveMarketingTierForBarberCount(1);
    const t2 = resolveMarketingTierForBarberCount(2);
    const t3 = resolveMarketingTierForBarberCount(3);
    const t5 = resolveMarketingTierForBarberCount(5);
    const t6 = resolveMarketingTierForBarberCount(6);
    const t10 = resolveMarketingTierForBarberCount(10);
    assert.ok(t1 && t1 !== "contact");
    assert.ok(t2 && t2 !== "contact");
    assert.ok(t3 && t3 !== "contact");
    assert.ok(t5 && t5 !== "contact");
    assert.ok(t6 && t6 !== "contact");
    assert.ok(t10 && t10 !== "contact");
    assert.equal(t1.monthlyPriceThb, 399);
    assert.equal(t2.monthlyPriceThb, 399);
    assert.equal(t3.monthlyPriceThb, 599);
    assert.equal(t5.monthlyPriceThb, 599);
    assert.equal(t6.monthlyPriceThb, 999);
    assert.equal(t10.monthlyPriceThb, 999);
    assert.equal(resolveMarketingTierForBarberCount(11), "contact");
    assert.equal(resolveMarketingTierForBarberCount(20), "contact");
  });

  it("formats baht, per-day hint, and price/price2/price3 placeholders", () => {
    assert.equal(formatBaht(399), "฿399");
    assert.equal(formatBaht(599), "฿599");
    assert.equal(formatBaht(999), "฿999");
    assert.match(tierPerDayHint(marketingOffer.tiers[0], "th") ?? "", /13/);
    assert.equal(tierPerDayHint(marketingOffer.tiers[1], "th"), null);
    assert.match(
      fillOfferCopy("{days} / {quota} / {price} / {price2} / {price3}"),
      /30 \/ 300 \/ ฿399 \/ ฿599 \/ ฿999/,
    );
  });

  it("tier1 pricing row includes free owner/manager seat", () => {
    assert.equal(
      tierBarberRangeLabel(marketingOffer.tiers[0], "th"),
      "1–2 ช่าง + เจ้าของ/ผู้จัดการ 1 คน",
    );
    assert.equal(tierBarberRangeLabel(marketingOffer.tiers[1], "th"), "3–5 ช่าง");
  });
});
