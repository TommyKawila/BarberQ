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
    assert.match(hero, /handPhoneHero/);
    assert.match(hero, /object-cover/);
    assert.match(hero, /backdrop-blur/);
    assert.match(hero, /md:hidden/);
    assert.doesNotMatch(hero, /hero-barbershop-bg\.png/);
    assert.match(hero, /marketing\.hero\.micro/);
    assert.match(hero, /min-w-0/);
    assert.match(hero, /max-w-full/);
    assert.match(nav, /MarketingTrialLink/);
    assert.doesNotMatch(sales, /href="\/trial"/);
    assert.doesNotMatch(hero, /href="\/trial"/);
    assert.doesNotMatch(nav, /href="\/trial"/);
  });

  it("hero uses pre-composited hand-phone as primary visual with overflow guards", () => {
    const mockups = readFileSync(
      resolve(root, "components/marketing/mockups/CustomerJourneyMockups.tsx"),
      "utf8",
    );
    const hand = readFileSync(
      resolve(root, "components/marketing/mockups/HandPhoneComposite.tsx"),
      "utf8",
    );
    const phone = readFileSync(
      resolve(root, "components/marketing/mockups/PhoneFrame.tsx"),
      "utf8",
    );
    const heroFn = mockups.slice(mockups.indexOf("export function HeroProductMockups"));
    assert.match(heroFn, /HandPhoneComposite/);
    assert.match(heroFn, /overflow-x-clip|overflow-hidden/);
    assert.match(heroFn, /max-w-full/);
    // Mobile hero breaks out of section padding to fill screen width
    assert.match(heroFn, /calc\(100%\+2rem\)|w-\[calc/);
    assert.match(hand, /handPhoneHero/);
    assert.match(hand, /handPhoneHero\.mobile/);
    assert.match(hand, /handPhoneHero\.desktop/);
    assert.match(hand, /sizes="100vw"/);
    assert.match(phone, /Dynamic Island|dynamic island/i);
    assert.match(phone, /390\s*\/\s*844/);
    const screens = readFileSync(resolve(root, "lib/marketing/screens.ts"), "utf8");
    assert.match(screens, /hand-phone-mobile\.webp/);
    assert.match(screens, /hand-phone-desktop\.webp/);
    assert.match(screens, /mobileWidth:\s*1284/);
    assert.ok(
      existsSync(resolve(root, "../public/marketing/hand-phone.webp")),
      "hand-phone.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/hero/hand-phone-composited.webp")),
      "hand-phone-composited.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/choose-slot.webp")),
      "choose-slot.webp missing",
    );
  });

  it("retired HTML hero phone mockup is gone", () => {
    assert.equal(
      existsSync(resolve(root, "components/marketing/mockups/HeroPhoneMockups.tsx")),
      false,
    );
  });

  it("pain section uses designer bullets and keeps chat mockup interruption-only", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const pain = readFileSync(
      resolve(root, "components/marketing/mockups/PainChatMockup.tsx"),
      "utf8",
    );
    assert.match(sales, /PainChatMockup/);
    assert.match(sales, /marketing\.pain\.bullet/);
    assert.doesNotMatch(sales, /from: "shop"/);
    assert.doesNotMatch(pain, /from: "shop"|shopLabel/);
    assert.match(dictionary.th["marketing.pain.title"], /ว่างกี่โมง/);
  });

  it("sales page follows approved section order with sticky CTA and no chips", () => {
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
      "marketing.sticky.cta",
    ];
    let cursor = 0;
    for (const token of order) {
      const idx = sales.indexOf(token, cursor);
      assert.ok(idx >= 0, `missing ordered token: ${token}`);
      cursor = idx + token.length;
    }
    assert.match(sales, /SHOW_TESTIMONIALS_PLACEHOLDER = false/);
    assert.match(sales, /h-14/);
    assert.doesNotMatch(sales, /barber\.chip|BARBER_CHIPS/);
    assert.doesNotMatch(sales, /before-manual-booking\.png/);
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
  it("keeps TH/EN parity, free-trial wording, and no chip keys", () => {
    const thKeys = Object.keys(dictionary.th).filter((k) => k.startsWith("marketing."));
    const enKeys = Object.keys(dictionary.en).filter((k) => k.startsWith("marketing."));
    assert.deepEqual(thKeys.sort(), enKeys.sort());
    assert.equal(thKeys.some((k) => k.includes("barber.chip")), false);
    assert.ok(dictionary.th["marketing.features.6.title"]);
    assert.ok(dictionary.th["marketing.faq.7.q"]);
    assert.match(dictionary.th["marketing.hero.cta"], /ทดลองใช้ฟรี \{days\} วัน/);
    assert.match(dictionary.en["marketing.hero.cta"], /free \{days\}-day trial/i);
  });

  it("rejects unverifiable and outdated pricing claims", () => {
    const th = visibleValues("marketing.", "th");
    const en = visibleValues("marketing.", "en");
    assert.doesNotMatch(th, /฿699|ราคาเดียวทั้งร้าน|รองรับร้าน 5 ช่าง/);
    assert.doesNotMatch(en, /฿699|one price for the whole shop|supports 5 barbers/i);
    const claimKeys = Object.entries(dictionary.th).filter(
      ([k]) =>
        k.startsWith("marketing.") &&
        !k.startsWith("marketing.trial.shopName") &&
        !k.startsWith("marketing.trial.contactName") &&
        !k.startsWith("marketing.trial.contactValue"),
    );
    for (const [key, value] of claimKeys) {
      assert.doesNotMatch(value, /\*/, `claim asterisk left on ${key}`);
    }
    assert.match(th, /1–5 ช่าง|1–5/);
    assert.match(th, /6–10/);
    assert.match(th, /เกิน 10|มากกว่า 10/);
    assert.match(dictionary.th["marketing.coming.1.title"], /สรุปยอด|รายได้/);
    assert.match(dictionary.th["marketing.coming.2.title"], /ก่อนวันนัด 1 วัน/);
  });

  it("FAQ explains LINE quota, Web Push, and tier pricing", () => {
    assert.match(dictionary.th["marketing.faq.3.a"], /\{quota\}/);
    assert.match(dictionary.th["marketing.faq.3.a"], /reply|ตอบกลับ/);
    assert.doesNotMatch(dictionary.th["marketing.faq.3.a"], /เป็นทางเลือก/);
    assert.match(dictionary.th["marketing.faq.4.a"], /Web Push/);
    assert.match(dictionary.en["marketing.faq.4.a"], /Web Push/);
    assert.match(dictionary.th["marketing.faq.7.a"], /1–5 ช่าง \{price\}/);
    assert.match(dictionary.en["marketing.faq.7.a"], /1–5 barbers \{price\}/);
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
