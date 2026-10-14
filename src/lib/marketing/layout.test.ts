import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";
import { marketingClaims, marketingOffer } from "@/lib/marketing/offer";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";

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
    assert.match(sales, /PrimaryTrialCta/);
    assert.match(hero, /PrimaryTrialCta/);
    assert.match(hero, /MarketingPhotoSlot/);
    assert.match(hero, /heroHandPhone/);
    assert.match(hero, /linear-gradient\(to right/);
    assert.match(hero, /right-0/);
    assert.match(hero, /md:hidden/);
    assert.doesNotMatch(hero, /hand-phone-cutout/);
    assert.doesNotMatch(hero, /hero-barbershop-bg\.png/);
    assert.match(hero, /marketing\.hero\.micro/);
    assert.match(hero, /min-w-0/);
    assert.match(hero, /max-w-full/);
    assert.match(nav, /MarketingTrialLink/);
    assert.doesNotMatch(sales, /href="\/trial"/);
    assert.doesNotMatch(hero, /href="\/trial"/);
    assert.doesNotMatch(nav, /href="\/trial"/);
  });

  it("how-it-works desktop steps map screens to matching copy", () => {
    const mockups = readFileSync(
      resolve(root, "components/marketing/mockups/CustomerJourneyMockups.tsx"),
      "utf8",
    );
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    assert.match(sales, /lg:grid-cols-3/);
    assert.match(sales, /CustomerStepPhone/);
    const stepFn = mockups.slice(mockups.indexOf("export function CustomerStepPhone"));
    assert.match(stepFn, /hidden lg:block/);
    assert.match(stepFn, /size="md"/);
    assert.match(mockups, /1:\s*"choose"/);
    assert.match(mockups, /2:\s*"ticket"/);
    assert.match(mockups, /3:\s*"adminQueue"/);
    assert.match(dictionary.th["marketing.how.1.desc"], /เลือกช่าง|วัน|เวลา/);
    assert.match(dictionary.th["marketing.how.2.title"], /บัตรคิว/);
    assert.match(dictionary.th["marketing.how.3.desc"], /บอร์ด|แจ้งเตือน/);
  });

  it("photo slots and real screens exist for swap", () => {
    const slots = readFileSync(resolve(root, "lib/marketing/photo-slots.ts"), "utf8");
    assert.match(slots, /heroHandPhone/);
    assert.match(slots, /barberQueueBoard/);
    assert.match(slots, /founderTommy/);
    assert.match(slots, /\/marketing\/photos\//);
    assert.equal(marketingPhotoSlots.heroHandPhone.src, null);
    assert.equal(marketingPhotoSlots.barberQueueBoard.src, null);
    assert.equal(marketingPhotoSlots.founderTommy.src, null);
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/choose-slot.webp")),
      "choose-slot.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/admin-queue.webp")),
      "admin-queue.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/admin-stats.webp")),
      "admin-stats.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/queue-ticket.webp")),
      "queue-ticket.webp missing",
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

  it("sales page follows blueprint section order with sticky CTA and no coming-soon", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const order = [
      "ClarityMarketingScript",
      "SalesHero",
      "marketing.pain",
      'id="line-messages"',
      "how-it-works",
      "CustomerStepPhone",
      'id="board"',
      'id="owner"',
      'id="founder"',
      'id="pricing"',
      "marketingOffer.tiers",
      "marketing.trialBox",
      'id="faq"',
      "marketing.final",
      "sticky_cta_click",
    ];
    let cursor = 0;
    for (const token of order) {
      const idx = sales.indexOf(token, cursor);
      assert.ok(idx >= 0, `missing ordered token: ${token}`);
      cursor = idx + token.length;
    }
    assert.match(sales, /SHOW_TESTIMONIALS_PLACEHOLDER = false/);
    assert.doesNotMatch(sales, /id="coming-soon"/);
    assert.doesNotMatch(sales, /barber\.chip|BARBER_CHIPS/);
    assert.doesNotMatch(sales, /before-manual-booking\.png/);
    const ctaCount = (sales.match(/PrimaryTrialCta/g) ?? []).length;
    assert.ok(ctaCount >= 4, `expected >=4 PrimaryTrialCta uses, got ${ctaCount}`);
  });

  it("primary CTAs use strong amber style and verified risk-reversal only", () => {
    const cta = readFileSync(
      resolve(root, "components/marketing/PrimaryTrialCta.tsx"),
      "utf8",
    );
    const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
    assert.match(cta, /PRIMARY_TRIAL_CTA_CLASS/);
    assert.match(cta, /min-h-14/);
    assert.match(cta, /cta-pulse/);
    assert.match(cta, /marketing\.risk\.noCard/);
    assert.match(cta, /marketing\.risk\.cancelAnytime/);
    assert.doesNotMatch(cta, /ตั้งค่าเสร็จใน 10|setup in 10/i);
    assert.match(css, /@keyframes cta-pulse/);
    assert.match(dictionary.th["marketing.hero.cta"], /เริ่มใช้ฟรี \{days\} วัน →/);
    assert.match(dictionary.en["marketing.hero.cta"], /Start free for \{days\} days →/);
    assert.match(dictionary.th["marketing.risk.noCard"], /ไม่ต้องผูกบัตร/);
    assert.match(dictionary.th["marketing.risk.cancelAnytime"], /ยกเลิกได้ทุกเมื่อ/);
  });

  it("feature claims for short leads and self-reschedule default on (toggleable)", () => {
    assert.equal(marketingClaims.reminderShortLeads, true);
    assert.equal(marketingClaims.customerSelfReschedule, true);
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    assert.match(sales, /marketingClaims\.reminderShortLeads/);
    assert.match(sales, /marketingClaims\.customerSelfReschedule/);
    assert.match(sales, /marketing\.line\.lead3h/);
    assert.match(sales, /marketing\.line\.rescheduleTitle/);
    assert.match(dictionary.th["marketing.line.bullet2ShortLeads"], /3 ชม/);
    assert.match(dictionary.th["marketing.line.bullet3"], /เลื่อนคิวเอง/);
  });

  it("Clarity loads only via marketing script gated on env", () => {
    const clarity = readFileSync(
      resolve(root, "components/marketing/ClarityMarketingScript.tsx"),
      "utf8",
    );
    const events = readFileSync(resolve(root, "lib/marketing/events.ts"), "utf8");
    assert.match(clarity, /NEXT_PUBLIC_CLARITY_PROJECT_ID/);
    assert.match(clarity, /clarity\.ms\/tag/);
    assert.match(events, /clarity\("event"/);
    assert.match(events, /clarity\("set"/);
    const rootLayout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    assert.doesNotMatch(rootLayout, /ClarityMarketingScript|clarity\.ms/);
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
    assert.match(trial, /ClarityMarketingScript/);
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
    assert.ok(dictionary.th["marketing.line.title"]);
    assert.ok(dictionary.th["marketing.board.title"]);
    assert.ok(dictionary.th["marketing.founder.title"]);
    assert.ok(dictionary.th["marketing.faq.8.q"]);
    assert.match(dictionary.th["marketing.hero.cta"], /เริ่มใช้ฟรี \{days\} วัน →/);
    assert.match(dictionary.en["marketing.hero.cta"], /Start free for \{days\} days →/);
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
    assert.match(dictionary.th["marketing.features.7.title"], /สรุปยอด|รายได้/);
    assert.match(dictionary.th["marketing.features.8.title"], /แจ้งเตือนก่อนถึงคิว/);
    assert.match(dictionary.th["marketing.features.8.note"], /\{quota\}/);
    assert.equal(
      Object.keys(dictionary.th).some((k) => k === "marketing.coming.1.title"),
      false,
    );
  });

  it("FAQ states confirm/ticket/reminders are push quota messages", () => {
    assert.match(dictionary.th["marketing.faq.3.a"], /\{quota\}/);
    assert.match(dictionary.th["marketing.faq.3.a"], /push|เซิร์ฟเวอร์/);
    assert.doesNotMatch(dictionary.th["marketing.faq.3.a"], /reply|ตอบกลับ \(reply\)/);
    assert.match(dictionary.en["marketing.faq.3.a"], /server push/i);
    assert.doesNotMatch(dictionary.en["marketing.faq.3.a"], /reply messages/i);
    assert.match(dictionary.th["marketing.faq.4.a"], /เปิด–ปิด|เปิด\/ปิด|เปิด-ปิด/);
    assert.match(dictionary.th["marketing.faq.5.a"], /Web Push/);
    assert.match(dictionary.en["marketing.faq.5.a"], /Web Push/);
    assert.match(dictionary.th["marketing.faq.8.a"], /1–5 ช่าง \{price\}/);
    assert.match(dictionary.th["marketing.faq.8.a"], /\{price2\}/);
    assert.match(dictionary.en["marketing.faq.8.a"], /1–5 barbers \{price\}/);
    assert.match(dictionary.en["marketing.faq.8.a"], /\{price2\}/);
  });

  it("offer.ts is the only hardcoded public price source for tiers", () => {
    const offer = readFileSync(resolve(root, "lib/marketing/offer.ts"), "utf8");
    const sales = readFileSync(resolve(root, "components/marketing/SalesPage.tsx"), "utf8");
    assert.match(offer, /monthlyPriceThb: 599/);
    assert.match(offer, /monthlyPriceThb: 999/);
    assert.match(offer, /marketingClaims/);
    assert.match(offer, /\{price2\}/);
    assert.match(sales, /marketingOffer\.tiers/);
    assert.doesNotMatch(sales, /฿599|฿999|monthlyPriceThb:\s*599/);
    assert.equal(marketingOffer.tiers.length, 2);
  });
});
