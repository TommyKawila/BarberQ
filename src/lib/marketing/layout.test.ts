import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";
import { marketingOffer } from "@/lib/marketing/offer";

const root = resolve(import.meta.dirname, "../..");

describe("marketing layout split", () => {
  it("root layout has no max-w-lg", () => {
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /max-w-lg/);
  });

  it("shop layout keeps max-w-lg via PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/[shop]/layout.tsx"), "utf8");
    assert.match(layout, /PhoneShell/);
  });

  it("app group layout keeps PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/(app)/layout.tsx"), "utf8");
    assert.match(layout, /PhoneShell/);
  });

  it("operator layout is full width without PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/(operator)/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /PhoneShell/);
    assert.doesNotMatch(layout, /max-w-lg/);
  });

  it("superadmin pages live in operator group", () => {
    const shops = readFileSync(resolve(root, "app/(operator)/superadmin/page.tsx"), "utf8");
    const page = readFileSync(
      resolve(root, "app/(operator)/superadmin/trial-leads/page.tsx"),
      "utf8",
    );
    assert.match(shops, /superadmin/);
    assert.match(page, /TrialLeadsCrm/);
  });

  it("sales page CTAs use the shared trial destination builder", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const hero = readFileSync(
      resolve(root, "components/marketing/SalesHero.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      resolve(root, "components/marketing/MarketingNav.tsx"),
      "utf8",
    );
    assert.match(sales, /SalesHero/);
    assert.match(sales, /MarketingTrialLink/);
    assert.match(hero, /MarketingTrialLink/);
    assert.match(hero, /HeroProductMockups/);
    assert.doesNotMatch(hero, /hero-barbershop-bg\.png/);
    assert.doesNotMatch(hero, /hero-phone-hand\.png/);
    assert.match(hero, /marketing\.hero\.ctaExpect/);
    assert.doesNotMatch(hero, /HeroPhoneMockups/);
    assert.match(nav, /MarketingTrialLink/);
    assert.doesNotMatch(sales, /href="\/trial"/);
    assert.doesNotMatch(hero, /href="\/trial"/);
    assert.doesNotMatch(nav, /href="\/trial"/);
    assert.doesNotMatch(sales, /variant="trial"/);
  });

  it("retired HTML hero phone mockup is gone", () => {
    assert.equal(
      existsSync(resolve(root, "components/marketing/mockups/HeroPhoneMockups.tsx")),
      false,
    );
  });

  it("pain section is interruption-only without shop replies", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const pain = readFileSync(
      resolve(root, "components/marketing/mockups/PainChatMockup.tsx"),
      "utf8",
    );
    const dict = readFileSync(resolve(root, "lib/i18n/dictionary.ts"), "utf8");
    assert.match(sales, /PainChatMockup/);
    assert.doesNotMatch(sales, /from: "shop"/);
    assert.doesNotMatch(pain, /from: "shop"|shopLabel/);
    assert.match(dict, /ทุกข้อความหมายถึงการต้องหยุด แล้วกลับมาตอบเรื่องเดิมอีกครั้ง/);
  });

  it("sales page follows approved section order with app mockups", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const order = [
      "SalesHero",
      "marketing.pain",
      "how-it-works",
      "CustomerStepPhone",
      'id="features"',
      "coming-soon",
      'id="pricing"',
      "marketingOffer.tiers",
      'id="faq"',
      "marketing.final",
    ];
    let cursor = 0;
    for (const token of order) {
      const idx = sales.indexOf(token, cursor);
      assert.ok(idx >= 0, `missing ordered token: ${token}`);
      cursor = idx + token.length;
    }
    assert.match(sales, /SHOW_TESTIMONIALS_PLACEHOLDER = false/);
    assert.match(sales, /OwnerSurfacePhone/);
    assert.doesNotMatch(sales, /before-manual-booking\.png/);
    assert.doesNotMatch(sales, /after-organized-workflow\.png/);
  });

  it("trial page uses focused chrome without sales nav CTA", () => {
    const trial = readFileSync(
      resolve(root, "components/marketing/TrialForm.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      resolve(root, "components/marketing/MarketingNav.tsx"),
      "utf8",
    );
    assert.match(trial, /variant="trial"/);
    assert.match(trial, /noValidate/);
    assert.match(trial, /marketing.trial.backHome/);
    assert.match(trial, /marketing.trial.priceExpect/);
    assert.doesNotMatch(trial, /← Home/);
    assert.match(nav, /variant === "trial"/);
  });
});

function visibleValues(prefix: string, locale: "th" | "en"): string {
  return Object.entries(dictionary[locale])
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .join("\n");
}

describe("visible marketing claim locks", () => {
  it("keeps TH/EN marketing key parity including chip6 and faq7", () => {
    const thKeys = Object.keys(dictionary.th).filter((k) => k.startsWith("marketing."));
    const enKeys = Object.keys(dictionary.en).filter((k) => k.startsWith("marketing."));
    assert.deepEqual(thKeys.sort(), enKeys.sort());
    assert.equal(dictionary.th["marketing.barber.chip6"], "Walk-in");
    assert.equal(dictionary.en["marketing.barber.chip6"], "Walk-in");
    assert.ok(dictionary.th["marketing.features.6.title"]);
    assert.ok(dictionary.en["marketing.features.6.title"]);
    assert.ok(dictionary.th["marketing.faq.7.q"]);
    assert.ok(dictionary.en["marketing.faq.7.q"]);
  });

  it("public marketing values use trial + tier pricing without invented social proof", () => {
    const th = visibleValues("marketing.", "th");
    const en = visibleValues("marketing.", "en");
    assert.match(th, /ทดลองใช้ \{days\} วัน/);
    assert.match(en, /\{days\}-day trial/i);
    assert.match(th, /1–5 ช่าง|1–5/);
    assert.match(en, /1–5 barbers|1–5/);
    assert.doesNotMatch(th, /ทำไมร้านตัดผมเลือก/);
    assert.doesNotMatch(en, /why barbershops choose/i);
    assert.doesNotMatch(th, /รายได้เพิ่มขึ้น|ไม่มาตามนัด/i);
    assert.doesNotMatch(en, /increased revenue|no-show rate/i);
    assert.match(th, /Coming soon|เร็ว ๆ นี้/);
    assert.match(dictionary.th["marketing.coming.1.title"], /รายได้|สรุป/);
    assert.match(dictionary.en["marketing.coming.2.title"], /Day-before|reminder/i);
  });

  it("FAQ 5 states LINE reply confirmations are not optional push quota", () => {
    const thFaq5 = dictionary.th["marketing.faq.5.a"];
    const enFaq5 = dictionary.en["marketing.faq.5.a"];
    assert.match(thFaq5, /\{quota\}/);
    assert.match(enFaq5, /\{quota\}/);
    assert.match(thFaq5, /reply|ตอบกลับ/);
    assert.match(enFaq5, /reply messages/i);
    assert.doesNotMatch(thFaq5, /เป็นทางเลือก/);
    assert.doesNotMatch(enFaq5, /optional/i);
    assert.match(thFaq5, /ไม่นับในโควตา/);
    assert.match(enFaq5, /do not count toward the push quota/i);
  });

  it("offer.ts is the only hardcoded public price source for tiers", () => {
    const offer = readFileSync(resolve(root, "lib/marketing/offer.ts"), "utf8");
    const sales = readFileSync(resolve(root, "components/marketing/SalesPage.tsx"), "utf8");
    assert.match(offer, /monthlyPriceThb: 599/);
    assert.match(offer, /monthlyPriceThb: 999/);
    assert.match(sales, /marketingOffer\.tiers/);
    assert.doesNotMatch(sales, /฿599|฿999|monthlyPriceThb:\s*599/);
    assert.equal(marketingOffer.tiers.length, 2);
  });
});
