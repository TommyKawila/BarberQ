import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOverTierPromptCopy,
  countBookableBarberSeats,
  countsTowardBarberQuota,
  crossedOverTierThreshold,
  evaluateOverTierAfterSeatChange,
  isOverTier,
  isShopInTrialPeriod,
  normalizeBarberTier,
  tierMaxBookable,
} from "@/lib/billing/barber-tier";
import {
  collectShopSeatFlags,
  isSuspiciousBarberName,
} from "@/lib/billing/over-tier-flags";
import type { Barber, Shop } from "@/types/booking";

function shop(partial: Partial<Shop> = {}): Shop {
  return {
    id: "s1",
    name: "Test",
    slug: "test",
    status: "active",
    subscribed_until: null,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    barber_tier: "tier1",
    ...partial,
  };
}

function barber(partial: Partial<Barber> = {}): Barber {
  return {
    id: partial.id ?? "b1",
    name: partial.name ?? "เจ",
    slot_duration_minutes: 30,
    off_days: [],
    created_at: new Date().toISOString(),
    role: "barber",
    is_active: true,
    is_bookable: true,
    ...partial,
  };
}

describe("barber-tier helpers", () => {
  it("normalizes unknown tiers to tier1", () => {
    assert.equal(normalizeBarberTier(undefined), "tier1");
    assert.equal(normalizeBarberTier("tier2"), "tier2");
    assert.equal(normalizeBarberTier("nope"), "tier1");
  });

  it("tier max seats match marketing packages", () => {
    assert.equal(tierMaxBookable("tier1"), 2);
    assert.equal(tierMaxBookable("tier2"), 5);
    assert.equal(tierMaxBookable("tier3"), 10);
    assert.equal(tierMaxBookable("contact"), null);
  });

  it("counts only active bookable seats (owner off bookable is free)", () => {
    const list = [
      barber({ id: "o", role: "owner", is_bookable: false }),
      barber({ id: "b1" }),
      barber({ id: "b2" }),
      barber({ id: "b3", is_active: false }),
      barber({ id: "b4", is_bookable: false }),
    ];
    assert.equal(countBookableBarberSeats(list), 2);
    assert.equal(countsTowardBarberQuota(list[0]), false);
    assert.equal(
      countsTowardBarberQuota(barber({ role: "owner", is_bookable: true })),
      true,
    );
  });

  it("detects over-tier and threshold crossings at 3/6/11", () => {
    assert.equal(isOverTier(3, "tier1"), true);
    assert.equal(isOverTier(2, "tier1"), false);
    assert.equal(crossedOverTierThreshold(2, 3), true);
    assert.equal(crossedOverTierThreshold(5, 6), true);
    assert.equal(crossedOverTierThreshold(10, 11), true);
    assert.equal(crossedOverTierThreshold(3, 4), false);
  });

  it("skips over-tier prompt during 30-day trial", () => {
    const young = shop({
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.equal(isShopInTrialPeriod(young), true);
    const before = [barber({ id: "1" }), barber({ id: "2" })];
    const result = evaluateOverTierAfterSeatChange({
      shop: young,
      barbersBefore: before,
      bookableCountAfter: 3,
    });
    assert.equal(result.showPrompt, false);
  });

  it("shows prompt after trial when crossing to 3 seats; copy mentions next billing cycle", () => {
    const before = [barber({ id: "1" }), barber({ id: "2" })];
    const result = evaluateOverTierAfterSeatChange({
      shop: shop(),
      barbersBefore: before,
      bookableCountAfter: 3,
    });
    assert.equal(result.showPrompt, true);
    assert.match(result.prompt?.body ?? "", /รอบบิลถัดไป/);
    assert.doesNotMatch(result.prompt?.body ?? "", /14\s*วัน/);
    assert.equal(result.prompt?.primaryCta, "เพิ่มช่างต่อ");
    assert.equal(result.prompt?.secondaryCta, "มีคำถาม? ทักเรา");
    assert.equal(result.prompt?.signature, null);
    assert.doesNotMatch(result.prompt?.body ?? "", /ทักไปทาง LINE|Tommy/);
    assert.match(result.prompt?.body ?? "", /ไม่ต้องทำอะไรเพิ่ม/);
    assert.equal(result.prompt?.bodyParagraphs.length, 2);
    assert.match(result.prompt?.bodyParagraphs[1] ?? "", /฿599/);
    const copy6 = buildOverTierPromptCopy(6);
    assert.match(copy6?.body ?? "", /฿999/);
    assert.equal(copy6?.secondaryCta, "มีคำถาม? ทักเรา");
    assert.equal(copy6?.bodyParagraphs.length, 2);
  });
});

describe("over-tier flags", () => {
  it("flags suspicious names and over-tier", () => {
    assert.equal(isSuspiciousBarberName("กะเช้า"), true);
    assert.equal(isSuspiciousBarberName("ช่าง1"), true);
    assert.equal(isSuspiciousBarberName("เจ"), false);
    const flags = collectShopSeatFlags({
      shop: shop({ barber_tier: "tier1" }),
      barbers: [
        barber({ id: "1", name: "เจ" }),
        barber({ id: "2", name: "มิกซ์" }),
        barber({ id: "3", name: "กะบ่าย" }),
      ],
    });
    assert.ok(flags.some((f) => f.code === "over_tier"));
    assert.ok(flags.some((f) => f.code === "suspicious_name"));
  });
});
