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
    assert.match(hero, /heroDesktop/);
    assert.match(hero, /heroMobile/);
    assert.match(hero, /linear-gradient\(to right/);
    assert.match(hero, /linear-gradient\(to bottom/);
    assert.match(hero, /right center/);
    assert.match(hero, /hidden lg:block/);
    assert.match(hero, /lg:hidden/);
    assert.doesNotMatch(hero, /hand-phone-cutout/);
    assert.doesNotMatch(hero, /hero-barbershop-bg\.png/);
    assert.match(hero, /marketing\.hero\.micro/);
    assert.match(hero, /marketing\.hero\.setup/);
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

  it("photo slots define desktop/mobile art direction and stay null until swapped", () => {
    const slots = readFileSync(resolve(root, "lib/marketing/photo-slots.ts"), "utf8");
    const photoUi = readFileSync(
      resolve(root, "components/marketing/MarketingPhotoSlot.tsx"),
      "utf8",
    );
    assert.match(slots, /hero-desktop\.webp/);
    assert.match(slots, /hero-mobile\.webp/);
    assert.match(slots, /barber-desktop\.webp/);
    assert.match(slots, /barber-mobile\.webp/);
    assert.match(slots, /founder\.webp/);
    assert.match(slots, /2400/);
    assert.match(slots, /1080/);
    assert.match(slots, /1024/);
    assert.match(photoUi, /hidden lg:block/);
    assert.match(photoUi, /lg:hidden/);
    assert.match(photoUi, /labelTh/);
    assert.match(slots, /\/sale\/pain-barber\.webp/);
    assert.match(slots, /\/sale\/solution-customer\.webp/);
    assert.match(slots, /\/sale\/solution-barber-calm\.webp/);
    assert.match(slots, /\/sale\/booking-success-barber\.webp/);
    assert.match(slots, /labelTh/);
    assert.equal(
      marketingPhotoSlots.heroDesktop.src,
      "/marketing/photos/hero-desktop.webp",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-desktop.webp")),
      "hero-desktop.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-desktop.ai-source.webp")),
      "hero-desktop.ai-source.webp missing (rebuild plate)",
    );
    assert.equal(
      marketingPhotoSlots.heroMobile.src,
      "/marketing/photos/hero-mobile.webp",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-mobile.webp")),
      "hero-mobile.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-mobile.ai-source.webp")),
      "hero-mobile.ai-source.webp missing (rebuild plate)",
    );
    assert.match(
      marketingPhotoSlots.heroDesktop.artNote,
      /queue-ticket\.webp|booking-confirmed/,
    );
    assert.ok(
      existsSync(resolve(root, "../scripts/composite-hero-phone-screens.py")),
      "hero phone composite script missing",
    );
    assert.equal(
      marketingPhotoSlots.barberDesktop.src,
      "/marketing/photos/barber-desktop.webp",
    );
    assert.equal(
      marketingPhotoSlots.barberMobile.src,
      "/marketing/photos/barber-mobile.webp",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/barber-desktop.webp")),
      "barber-desktop.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/barber-mobile.webp")),
      "barber-mobile.webp missing",
    );
    assert.equal(marketingPhotoSlots.founder.src, "/marketing/photos/founder.webp");
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/founder.webp")),
      "founder.webp missing",
    );
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

  it("pain section uses Option C checklist + notification storm", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const storm = readFileSync(
      resolve(root, "components/marketing/mockups/PainStormVisual.tsx"),
      "utf8",
    );
    assert.match(sales, /PainStormVisual/);
    assert.match(sales, /marketing\.pain\.titleLead/);
    assert.match(sales, /marketing\.pain\.titleRest/);
    assert.match(sales, /marketing\.pain\.bullet/);
    assert.match(sales, /marketing\.pain\.punchline/);
    assert.match(sales, /marketing\.pain\.photoAlt/);
    assert.match(sales, /border-b border-zinc-800/);
    assert.match(storm, /unreadLabel/);
    assert.match(storm, /times/);
    assert.match(storm, /#06C755/);
    assert.match(storm, /aspect-\[5\/6\]/);
    assert.match(storm, /painBarber/);
    assert.equal(dictionary.th["marketing.pain.unreadBadge"], "99+");
    assert.equal(dictionary.en["marketing.pain.unreadBadge"], "99+");
    assert.ok(dictionary.th["marketing.pain.photoAlt"]);
    assert.ok(dictionary.en["marketing.pain.photoAlt"]);
    assert.equal(dictionary.th["marketing.pain.titleLead"], "ว่างกี่โมงครับ?");
    assert.doesNotMatch(dictionary.th["marketing.pain.bullet1"], /—/);
    assert.equal(marketingPhotoSlots.painBarber.src, "/sale/pain-barber.webp");
    assert.equal(marketingPhotoSlots.painBarber.swapPath, "/sale/pain-barber.webp");
    assert.match(marketingPhotoSlots.painBarber.labelTh, /รูปช่างเหนื่อย/);
    assert.equal(marketingPhotoSlots.painBarber.ratio, "4:5");
    assert.ok(
      existsSync(resolve(root, "../public/sale/pain-barber.webp")),
      "pain-barber.webp missing",
    );
    assert.doesNotMatch(sales, /from: "shop"/);
    assert.doesNotMatch(storm, /from: "shop"|shopLabel/);
    assert.match(dictionary.th["marketing.pain.title"], /ว่างกี่โมง/);
    assert.match(dictionary.th["marketing.pain.punchline"], /ค่าตัดผมที่ไม่ได้เก็บ/);
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
    const hero = readFileSync(
      resolve(root, "components/marketing/SalesHero.tsx"),
      "utf8",
    );
    assert.match(cta, /PRIMARY_TRIAL_CTA_CLASS/);
    assert.match(cta, /min-h-11/);
    assert.match(cta, /md:min-h-14/);
    assert.match(cta, /px-8/);
    assert.match(cta, /cta-pulse/);
    assert.match(cta, /0_4px_14px_rgba\(251,191,36,0\.28\)/);
    assert.match(cta, /mt-4/);
    assert.match(cta, /justify-center/);
    assert.match(cta, /marketing\.risk\.noCard/);
    assert.match(cta, /marketing\.risk\.cancelAnytime/);
    assert.doesNotMatch(cta, /ตั้งค่าเสร็จใน 10|setup in 10/i);
    assert.match(css, /@keyframes cta-pulse/);
    assert.match(css, /0 4px 14px rgba\(251, 191, 36, 0\.28\)/);
    assert.match(dictionary.th["marketing.hero.cta"], /เริ่มใช้ฟรี \{days\} วัน →/);
    assert.match(dictionary.en["marketing.hero.cta"], /Start free for \{days\} days →/);
    assert.match(dictionary.th["marketing.risk.noCard"], /ไม่ต้องผูกบัตร/);
    assert.match(dictionary.th["marketing.risk.cancelAnytime"], /ยกเลิกได้ทุกเมื่อ/);
    // Hero: full-width primary <640px; secondary inline on sm+, text link on mobile
    assert.match(hero, /showRisk=\{false\}/);
    assert.match(hero, /RiskReversalRow/);
    assert.match(hero, /w-full justify-center/);
    assert.match(hero, /sm:w-auto/);
    assert.match(hero, /sm:inline-flex/);
    assert.match(hero, /sm:hidden/);
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
    assert.match(sales, /slot="solutionCustomer"/);
    assert.match(sales, /slot="solutionBarberCalm"/);
    assert.match(sales, /LineReminderMockup/);
    assert.equal(marketingPhotoSlots.solutionCustomer.src, "/sale/solution-customer.webp");
    assert.ok(
      existsSync(resolve(root, "../public/sale/solution-customer.webp")),
      "solution-customer.webp missing",
    );
    assert.equal(
      marketingPhotoSlots.solutionBarberCalm.src,
      "/sale/solution-barber-calm.webp",
    );
    assert.ok(
      existsSync(resolve(root, "../public/sale/solution-barber-calm.webp")),
      "solution-barber-calm.webp missing",
    );
    assert.equal(marketingPhotoSlots.solutionCustomer.swapPath, "/sale/solution-customer.webp");
    assert.equal(
      marketingPhotoSlots.solutionBarberCalm.swapPath,
      "/sale/solution-barber-calm.webp",
    );
    assert.equal(marketingPhotoSlots.bookingSuccessBarber.src, null);
    assert.equal(
      marketingPhotoSlots.bookingSuccessBarber.swapPath,
      "/sale/booking-success-barber.webp",
    );
    assert.match(marketingPhotoSlots.solutionCustomer.labelTh, /ลูกค้ายิ้ม/);
    assert.match(marketingPhotoSlots.solutionBarberCalm.labelTh, /ช่างผ่อนคลาย/);
    assert.match(dictionary.th["marketing.line.bullet2ShortLeads"], /3 ชม/);
    assert.match(dictionary.th["marketing.line.bullet3"], /เลื่อนคิวเอง/);
    assert.ok(dictionary.th["marketing.line.customerPhotoAlt"]);
    assert.ok(dictionary.th["marketing.line.barberCaption"]);
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
    assert.match(dictionary.th["marketing.hero.eyebrow"], /1–2 ช่าง/);
    assert.match(dictionary.th["marketing.hero.setup"], /ตั้งค่าเองได้ในไม่กี่นาที/);
    assert.match(dictionary.th["marketing.hero.micro"], /\{price\}/);
    assert.match(dictionary.th["marketing.pricing.title"], /\{price\}/);
    assert.match(dictionary.th["marketing.pricing.tier1Badge"], /ร้านเล็ก/);
    assert.match(dictionary.th["marketing.founder.body"], /ไม่ใช่เจ้าของร้าน/);
    assert.match(dictionary.en["marketing.founder.body"], /not a barber shop owner/i);
    assert.match(dictionary.th["marketing.faq.7.a"], /ตั้งค่าเองได้ในไม่กี่นาที/);
    const pricingUi = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    assert.match(pricingUi, /tier1Badge/);
    assert.match(pricingUi, /isStarter/);
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
    assert.match(th, /1–2/);
    assert.match(th, /3–5/);
    assert.match(th, /6–10/);
    assert.match(th, /เกิน 10|มากกว่า 10/);
    assert.match(th, /ไม่ขึ้นราคา/);
    assert.match(dictionary.th["marketing.features.7.title"], /รายได้|ไม่มา|ช่วงเวลายุ่ง/);
    assert.match(dictionary.th["marketing.features.8.title"], /แจ้งเตือนก่อนถึงคิว/);
    assert.match(dictionary.th["marketing.features.8.note"], /\{quota\}/);
    assert.match(dictionary.th["marketing.features.9.title"], /QR/);
    assert.match(dictionary.th["marketing.board.5.desc"], /สแกน QR|ลำดับคิวสด|ใกล้ถึงคิว/);
    assert.match(dictionary.th["marketing.owner.metric2"], /ไม่มา/);
    assert.match(dictionary.th["marketing.owner.metric3"], /ช่วงเวลายุ่ง|ยุ่ง/);
    assert.doesNotMatch(th, /จอทีวี|TV screen|waiting.?room display/i);
    assert.doesNotMatch(en, /in-shop TV|waiting.?room (TV|display)/i);
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
    assert.match(dictionary.th["marketing.faq.8.a"], /1–2 ช่าง \{price\}/);
    assert.match(dictionary.th["marketing.faq.8.a"], /3–5 ช่าง \{price2\}/);
    assert.match(dictionary.th["marketing.faq.8.a"], /6–10 ช่าง \{price3\}/);
    assert.match(dictionary.en["marketing.faq.8.a"], /1–2 barbers \{price\}/);
    assert.match(dictionary.en["marketing.faq.8.a"], /\{price2\}/);
    assert.match(dictionary.en["marketing.faq.8.a"], /\{price3\}/);
  });

  it("offer.ts is the only hardcoded public price source for tiers", () => {
    const offer = readFileSync(resolve(root, "lib/marketing/offer.ts"), "utf8");
    const sales = readFileSync(resolve(root, "components/marketing/SalesPage.tsx"), "utf8");
    assert.match(offer, /monthlyPriceThb: 399/);
    assert.match(offer, /monthlyPriceThb: 599/);
    assert.match(offer, /monthlyPriceThb: 999/);
    assert.match(offer, /marketingClaims/);
    assert.match(offer, /\{price3\}/);
    assert.match(sales, /marketingOffer\.tiers/);
    assert.match(sales, /lg:grid-cols-3/);
    assert.doesNotMatch(sales, /฿399|฿599|฿999|monthlyPriceThb:\s*399/);
    assert.equal(marketingOffer.tiers.length, 3);
  });
});
