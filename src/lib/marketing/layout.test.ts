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
    assert.match(hero, /right center/);
    assert.match(hero, /hidden lg:block/);
    assert.match(hero, /lg:hidden/);
    // Design C: photo is inline below copy — never absolute behind text on mobile
    assert.doesNotMatch(hero, /absolute inset-0 lg:hidden/);
    assert.match(hero, /subtitleShort/);
    // Mobile title: forced break after LINE so Thai “ไม่ต้อง” stays intact
    assert.match(hero, /mobileTitle/);
    assert.match(hero, /word-break:keep-all/);
    assert.match(hero, /h-\[52px\]/);
    assert.match(hero, /marketing\.hero\.micro/);
    assert.match(hero, /marketing\.hero\.setup/);
    assert.match(hero, /min-w-0/);
    assert.match(hero, /max-w-full/);
    assert.match(nav, /MarketingTrialLink/);
    // Mobile nav trial = gold outline; desktop stays solid amber
    assert.match(nav, /border-amber-400/);
    assert.match(nav, /bg-amber-400/);
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
    const mobileHow = readFileSync(
      resolve(root, "components/marketing/HowItWorksMobile.tsx"),
      "utf8",
    );
    assert.match(sales, /lg:grid-cols-3/);
    assert.match(sales, /CustomerStepPhone/);
    assert.match(sales, /HowItWorksMobile/);
    assert.match(sales, /via-zinc-900\/25/);
    assert.match(mobileHow, /role="tablist"/);
    assert.match(mobileHow, /aria-selected/);
    assert.match(mobileHow, /aria-controls/);
    assert.match(mobileHow, /prefers-reduced-motion/);
    assert.match(mobileHow, /IntersectionObserver/);
    assert.match(mobileHow, /max-w-\[200px\]/);
    assert.match(mobileHow, /marketing\.how\.eyebrow/);
    assert.match(sales, /scroll-mt-\[4\.5rem\]/);
    assert.match(sales, /id="how-it-works"[\s\S]*?data-hide-sticky/);
    assert.match(sales, /ScheduleBoardMockup/);
    assert.match(dictionary.th["marketing.line.scheduleTabNote"], /อีกแท็บคือคิววันนี้/);
    const scheduleMock = readFileSync(
      resolve(root, "components/marketing/mockups/ScheduleBoardMockup.tsx"),
      "utf8",
    );
    assert.match(scheduleMock, /aria-hidden/);
    assert.match(scheduleMock, /ว่าง/);
    assert.match(scheduleMock, /จองแล้ว/);
    assert.match(scheduleMock, /ตาราง/);
    assert.match(scheduleMock, /มิกซ์/);
    assert.match(scheduleMock, /โอ๊ต/);
    assert.match(scheduleMock, /เจ/);
    assert.match(scheduleMock, /ตัวอย่าง/);
    assert.doesNotMatch(scheduleMock, /<button/);
    const stepFn = mockups.slice(mockups.indexOf("export function CustomerStepPhone"));
    assert.match(stepFn, /hidden lg:block/);
    assert.match(stepFn, /size="md"/);
    assert.match(stepFn, /compact/);
    assert.match(stepFn, /safeTop/);
    assert.match(stepFn, /COMPACT_STEP_SCREENS/);
    assert.match(stepFn, /max-w-\[200px\]/);
    assert.match(mockups, /adminQueueBoard/);
    assert.match(mockups, /chooseCompact/);
    assert.match(mockups, /COMPACT_STEP_SCREENS/);
    const phoneScreen = readFileSync(
      resolve(root, "components/marketing/mockups/PhoneScreen.tsx"),
      "utf8",
    );
    assert.match(phoneScreen, /safeTop/);
    assert.match(phoneScreen, /h-\[14%\]/);
    assert.match(phoneScreen, /sampleLabel/);
    assert.match(phoneScreen, /ตัวอย่าง/);
    assert.match(stepFn, /safeTop=\{step !== 1\}/);
    assert.match(stepFn, /sampleLabel=\{step === 3\}/);
    assert.match(mockups, /1:\s*"choose"/);
    assert.match(mockups, /2:\s*"ticket"/);
    assert.match(mockups, /3:\s*"adminQueue"/);
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/admin-queue-board-demo.webp")),
      "admin-queue-board-demo.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/choose-booking-demo.webp")),
      "choose-booking-demo.webp missing",
    );
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
    assert.match(slots, /hero-desktop\.png/);
    assert.match(slots, /hero-mobile\.webp/);
    assert.match(slots, /barber-desktop\.webp/);
    assert.match(slots, /barber-mobile\.webp/);
    assert.match(slots, /founder\.webp/);
    assert.match(slots, /1731/);
    assert.match(slots, /1080/);
    assert.match(slots, /1024/);
    assert.match(photoUi, /hidden lg:block/);
    assert.match(photoUi, /lg:hidden/);
    assert.match(photoUi, /labelTh/);
    assert.match(photoUi, /fallbackSrc|picture/);
    assert.match(slots, /\/sale\/pain-barber-cutting\.webp/);
    assert.match(slots, /\/sale\/solution-customer\.webp/);
    assert.match(slots, /\/sale\/solution-barber-calm\.webp/);
    assert.match(slots, /\/sale\/booking-success-barber\.webp/);
    assert.match(slots, /labelTh/);
    assert.equal(
      marketingPhotoSlots.heroDesktop.src,
      "/marketing/photos/hero-desktop.webp",
    );
    assert.equal(
      marketingPhotoSlots.heroDesktop.fallbackSrc,
      "/marketing/photos/hero-desktop.png",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-desktop.webp")),
      "hero-desktop.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-desktop.png")),
      "hero-desktop.png missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-desktop.ai-source.webp")),
      "hero-desktop.ai-source.webp missing (rebuild plate)",
    );
    assert.equal(
      marketingPhotoSlots.heroMobile.src,
      "/marketing/photos/hero-mobile.webp",
    );
    assert.equal(
      marketingPhotoSlots.heroMobile.fallbackSrc,
      "/marketing/photos/hero-mobile.png",
    );
    assert.equal(marketingPhotoSlots.heroMobile.width, 1080);
    assert.equal(marketingPhotoSlots.heroMobile.height, 1350);
    assert.equal(marketingPhotoSlots.heroMobile.ratio, "4:5");
    assert.match(marketingPhotoSlots.heroMobile.artNote, /4:5|design C|1080/);
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-mobile.webp")),
      "hero-mobile.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-mobile.png")),
      "hero-mobile.png missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/hero-mobile.ai-source.webp")),
      "hero-mobile.ai-source.webp missing (rebuild plate)",
    );
    assert.match(
      marketingPhotoSlots.heroDesktop.artNote,
      /hero-composite|booking-success B2/,
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
      marketingPhotoSlots.barberDesktop.fallbackSrc,
      "/marketing/photos/barber-desktop.png",
    );
    assert.equal(marketingPhotoSlots.barberDesktop.width, 1672);
    assert.equal(marketingPhotoSlots.barberDesktop.height, 941);
    assert.match(
      marketingPhotoSlots.barberDesktop.artNote,
      /barber-ipad|blank black screen/,
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
      existsSync(resolve(root, "../public/marketing/photos/barber-desktop.png")),
      "barber-desktop.png missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/photos/barber-desktop.ai-source.png")),
      "barber-desktop.ai-source.png missing (Tommy plate)",
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
      existsSync(resolve(root, "../public/marketing/screens/choose-slot-demo.webp")),
      "choose-slot-demo.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/admin-queue-demo.webp")),
      "admin-queue-demo.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/marketing/screens/admin-stats-demo.webp")),
      "admin-stats-demo.webp missing",
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

  it("try-booking demo is client-side only with ClipperQ Demo barbers", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const demo = readFileSync(
      resolve(root, "components/marketing/TryBookingDemo.tsx"),
      "utf8",
    );
    assert.match(sales, /id="try-booking"/);
    assert.match(sales, /TryBookingDemo/);
    assert.match(sales, /marketing\.try\.featureWalkin/);
    assert.match(sales, /marketing\.try\.featureQr/);
    assert.match(sales, /marketing\.try\.featurePush/);
    assert.doesNotMatch(sales, /OwnerSurfacePhone/);
    assert.match(demo, /DEMO_SHOP_DISPLAY_NAME/);
    assert.match(demo, /มิกซ์/);
    assert.match(demo, /โอ๊ต/);
    assert.match(demo, /นนท์/);
    assert.doesNotMatch(demo, /นัท|แสบ|ไกด์|ไทด์|Saeb|Tide/);
    assert.match(demo, /marketing\.try\.disclaimer/);
    assert.match(demo, /marketing\.try\.tapBarber/);
    assert.match(demo, /marketing\.try\.tabCustomer/);
    assert.match(demo, /marketing\.try\.tabShop/);
    assert.match(demo, /marketing\.try\.seeShop/);
    assert.match(demo, /marketing\.try\.toastNotified/);
    assert.match(demo, /marketing\.try\.statusStart/);
    assert.match(demo, /marketing\.try\.statusDone/);
    assert.match(demo, /marketing\.try\.statusNoShow/);
    assert.match(demo, /data-demo-tap-hint/);
    assert.match(demo, /data-hide-sticky/);
    assert.match(demo, /data-demo-reset/);
    assert.match(demo, /data-demo-toast/);
    assert.match(demo, /data-demo-summary/);
    assert.match(demo, /by ClipperQ|brandFooter/);
    assert.match(demo, /prefers-reduced-motion/);
    assert.match(demo, /min-h-11|min-h-12|min-h-14/);
    assert.match(demo, /max-h-\[640px\]/);
    assert.doesNotMatch(demo, /fetch\(|supabase|insert|createAppointment/i);
    assert.equal(
      dictionary.th["marketing.try.disclaimer"],
      "ตัวอย่าง — ไม่ได้จองจริง",
    );
    assert.equal(dictionary.th["marketing.try.tapBarber"], "แตะเลือกช่าง");
    assert.equal(dictionary.th["marketing.try.reset"], "เริ่มใหม่");
    assert.match(dictionary.th["marketing.try.toastNotified"], /แจ้งเตือนถึงช่าง/);
    assert.match(dictionary.en["marketing.try.disclaimer"], /Demo only/i);
  });

  it("pain heading uses once-per-view hammer line reveal", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const hammer = readFileSync(
      resolve(root, "components/marketing/PainHammerTitle.tsx"),
      "utf8",
    );
    const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
    assert.match(sales, /PainHammerTitle/);
    assert.match(hammer, /marketing\.pain\.titleLead/);
    assert.match(hammer, /marketing\.pain\.titleRest/);
    assert.match(hammer, /IntersectionObserver/);
    assert.match(hammer, /prefers-reduced-motion/);
    assert.match(hammer, /pain-hammer-hit/);
    assert.match(hammer, /text-center/);
    assert.match(hammer, /md:text-left/);
    assert.match(css, /pain-hammer-in/);
    assert.match(css, /data-pain-hammer/);
  });

  it("sales page uses progressive scroll reveals", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const hook = readFileSync(
      resolve(root, "hooks/useSalesPageReveal.ts"),
      "utf8",
    );
    const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
    assert.match(sales, /useSalesPageReveal/);
    assert.match(sales, /data-reveal/);
    assert.match(sales, /data-reveal="emphasis"/);
    assert.match(hook, /IntersectionObserver/);
    assert.match(hook, /prefers-reduced-motion/);
    assert.match(hook, /data-cq-reveal/);
    assert.match(hook, /unobserve/);
    assert.match(css, /data-cq-reveal="on"/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.doesNotMatch(css, /\[data-reveal\]\s*\{\s*opacity:\s*0/);
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
    const hammer = readFileSync(
      resolve(root, "components/marketing/PainHammerTitle.tsx"),
      "utf8",
    );
    assert.match(sales, /PainStormVisual/);
    assert.match(sales, /PainHammerTitle/);
    assert.match(hammer, /marketing\.pain\.titleLead/);
    assert.match(hammer, /marketing\.pain\.titleRest/);
    assert.match(sales, /marketing\.pain\.bullet/);
    assert.match(sales, /marketing\.pain\.punchline/);
    assert.match(sales, /marketing\.pain\.photoAlt/);
    assert.match(sales, /border-b border-zinc-800/);
    assert.match(storm, /unreadLabel/);
    assert.match(storm, /times/);
    assert.match(storm, /#06C755/);
    assert.match(storm, /aspect-\[4\/5\]/);
    assert.match(storm, /lg:aspect-\[5\/6\]/);
    assert.match(storm, /object-cover/);
    assert.match(storm, /object-\[left_top\]/);
    assert.match(storm, /lg:object-\[center_top\]/);
    assert.match(storm, /bottom-4 left-3/);
    assert.match(storm, /gap-2/);
    assert.match(storm, /painBarber/);
    assert.match(storm, /prefers-reduced-motion/);
    assert.match(storm, /IntersectionObserver/);
    assert.match(storm, /pain-notif-enter/);
    assert.match(storm, /pain-badge-shake/);
    assert.match(storm, /MAX_VISIBLE/);
    assert.match(sales, /marketing\.pain\.chat5/);
    assert.match(sales, /marketing\.pain\.chat7/);
    assert.equal(dictionary.th["marketing.pain.unreadBadge"], "99+");
    assert.equal(dictionary.en["marketing.pain.unreadBadge"], "99+");
    assert.match(dictionary.th["marketing.pain.chat5"], /พรุ่งนี้ว่างไหม/);
    assert.match(dictionary.th["marketing.pain.chat6"], /ช่างมิกซ์อยู่ไหม/);
    assert.match(dictionary.th["marketing.faq.3.a"], /BMJ Open/);
    assert.doesNotMatch(dictionary.th["marketing.line.evidence"], /BMJ Open/);
    assert.match(dictionary.th["marketing.line.evidence"], /เครื่องคำนวณ/);
    assert.match(
      readFileSync(
        resolve(root, "components/marketing/mockups/WarmNoteFlexCard.tsx"),
        "utf8",
      ),
      /มิกซ์ · Mix/,
    );
    assert.match(dictionary.th["marketing.pain.chat7"], /เลื่อนเป็นบ่าย/);
    assert.ok(dictionary.th["marketing.pain.photoAlt"]);
    assert.ok(dictionary.en["marketing.pain.photoAlt"]);
    assert.equal(dictionary.th["marketing.pain.titleLead"], "ว่างกี่โมงครับ?");
    assert.doesNotMatch(dictionary.th["marketing.pain.bullet1"], /—/);
    // Pain Thai mid-word wrap guard (มือถือ / คิวเดียวกัน)
    assert.match(sales, /PAIN_TH_PHRASES/);
    assert.match(sales, /PainCopy/);
    assert.match(sales, /มือไม่ว่างก็ต้องหยิบมือถือ/);
    assert.match(sales, /เห็นคิวเดียวกัน/);
    assert.equal(
      marketingPhotoSlots.painBarber.src,
      "/sale/pain-barber-cutting.webp",
    );
    assert.equal(
      marketingPhotoSlots.painBarber.fallbackSrc,
      "/sale/pain-barber-cutting.png",
    );
    assert.equal(
      marketingPhotoSlots.painBarber.swapPath,
      "/sale/pain-barber-cutting.webp",
    );
    assert.equal(marketingPhotoSlots.painBarber.width, 1122);
    assert.equal(marketingPhotoSlots.painBarber.height, 1402);
    assert.match(marketingPhotoSlots.painBarber.labelTh, /กรรไกรไฟฟ้า/);
    assert.equal(marketingPhotoSlots.painBarber.ratio, "4:5");
    assert.ok(
      existsSync(resolve(root, "../public/sale/pain-barber-cutting.webp")),
      "pain-barber-cutting.webp missing",
    );
    assert.ok(
      existsSync(resolve(root, "../public/sale/pain-barber-cutting.png")),
      "pain-barber-cutting.png missing",
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
      'id="try-booking"',
      "TryBookingDemo",
      'id="board"',
      'id="owner"',
      "marketing.pain",
      'id="line-messages"',
      "how-it-works",
      "CustomerStepPhone",
      'id="founder"',
      'id="pricing"',
      "marketingOffer.tiers",
      "marketing.trialBox",
      'id="faq"',
      "marketing.final",
      "sticky_cta_click",
    ];
    assert.match(sales, /pb-\[calc\(110px\+env\(safe-area-inset-bottom\)\)\]/);
    assert.match(
      readFileSync(resolve(root, "components/marketing/SalesHero.tsx"), "utf8"),
      /href="#try-booking"/,
    );
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
    // Mobile sticky: soft gradient scrim (no hard top band) + hide when in-page CTAs visible
    assert.match(sales, /linear-gradient\(to top/);
    assert.match(sales, /data-inpage-trial-cta/);
    assert.doesNotMatch(sales, /border-t border-zinc-800 bg-zinc-950\/95/);
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
    // Hero mobile C: primary + outline secondary on one 52px row; risk under CTAs
    assert.match(hero, /showRisk=\{false\}/);
    assert.match(hero, /RiskReversalRow/);
    assert.match(hero, /h-\[52px\]/);
    assert.match(hero, /secondaryFallback/);
    assert.match(dictionary.th["marketing.hero.subtitleShort"], /ยืนยันใน LINE/);
    assert.match(
      dictionary.en["marketing.hero.subtitleShort"],
      /confirmed in LINE/i,
    );
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
    assert.match(sales, /marketing\.line\.bullet2ShortLeads/);
    assert.match(sales, /marketing\.line\.bullet3/);
    assert.doesNotMatch(sales, /marketing\.line\.leadsLabel/);
    assert.doesNotMatch(sales, /marketing\.line\.rescheduleTitle/);
    // Option B mood plate uses solutionCustomer src (no framed MarketingPhotoSlot)
    assert.match(sales, /marketingPhotoSlots\.solutionCustomer/);
    assert.match(sales, /slot="solutionBarberCalm"/);
    assert.match(sales, /LineConfirmMockup/);
    assert.match(sales, /LineReminderMockup/);
    assert.match(sales, /maskImage|WebkitMaskImage/);
    const warmNote = readFileSync(
      resolve(root, "components/marketing/mockups/WarmNoteFlexCard.tsx"),
      "utf8",
    );
    assert.match(warmNote, /ใกล้ถึงคิวของคุณแล้ว/);
    assert.match(warmNote, /✓ จองคิวเรียบร้อยแล้ว/);
    assert.match(warmNote, /ดูคิวของฉัน/);
    assert.match(warmNote, /เลื่อน \/ ยกเลิกนัด/);
    assert.match(warmNote, /#15803D/);
    assert.match(warmNote, /#B45309/);
    assert.match(warmNote, /#A12F3B/);
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
    assert.match(trial, /marketing.trial.lineSignup/);
    assert.match(trial, /resolveClipperqSupportLineUrl/);
    assert.match(nav, /variant === "trial"/);
  });

  it("ships stable OA rich-menu routes", () => {
    assert.equal(existsSync(resolve(root, "app/demo/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/demo/board/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/pricing/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/owner/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/guide/page.tsx")), true);
    const docs = readFileSync(resolve(root, "../docs/line-rich-menu.md"), "utf8");
    assert.match(docs, /\/trial/);
    assert.match(docs, /\/demo/);
    assert.match(docs, /#pricing/);
    assert.match(docs, /\/owner/);
    assert.match(docs, /\/guide/);
    assert.match(docs, /clipperqdemo/);
    assert.match(docs, /seed_clipperq_demo_prod\.sql/);
    assert.match(docs, /0042_shops_is_demo\.sql/);
    assert.match(docs, /Pre-check \(slug free\)/);
    assert.match(docs, /where slug = 'clipperqdemo'/);
    assert.match(docs, /read-only|อ่านอย่างเดียว/i);
    assert.doesNotMatch(docs, /default `phinxstudio`/);
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
    assert.match(th, /1–2 ช่าง|1–2/);
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
