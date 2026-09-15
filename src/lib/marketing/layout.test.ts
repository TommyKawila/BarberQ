import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";

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
    assert.match(hero, /hero-barbershop-bg\.png/);
    assert.match(hero, /hero-phone-hand\.png/);
    assert.match(hero, /from "next\/image"/);
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
    assert.doesNotMatch(dict, /ให้ BarberQx รับงานตรงนี้แทน/);
  });

  it("before after comparison uses supporting photos without overclaiming", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const dict = readFileSync(resolve(root, "lib/i18n/dictionary.ts"), "utf8");
    const assets = resolve(root, "../public/marketing/barberqx");
    assert.match(sales, /before-manual-booking\.png/);
    assert.match(sales, /after-organized-workflow\.png/);
    assert.match(sales, /from "next\/image"/);
    assert.match(sales, /marketing\.beforeAfter/);
    assert.match(sales, /bg-gradient-to-r from-zinc-950\/75 via-zinc-950\/35 to-transparent/);
    const takeawayIdx = sales.indexOf("{takeaway}");
    const flowOlIdx = sales.indexOf('<ol className="space-y-2">');
    assert.ok(takeawayIdx > 0);
    assert.ok(flowOlIdx > takeawayIdx);
    const ba = dict.match(
      /"marketing\.beforeAfter[\s\S]*?"marketing\.how\.title"/,
    );
    assert.ok(ba);
    assert.match(ba[0], /ร้านไม่ต้องตอบคำถามเรื่องคิวทีละข้อความ/);
    assert.doesNotMatch(ba[0], /no-show|revenue|reminder before|ไม่มาตามนัด|รายได้เพิ่มขึ้น/i);
    assert.equal(existsSync(resolve(assets, "before-manual-booking.png")), true);
    assert.equal(existsSync(resolve(assets, "after-organized-workflow.png")), true);
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
  it("public marketing values have no free trial, 10-barber package, or social-proof claims", () => {
    const th = visibleValues("marketing.", "th");
    const en = visibleValues("marketing.", "en");
    assert.match(th, /สมัครเข้าร่วม Pilot 30 วัน/);
    assert.match(th, /หลังจบ Pilot หากเลือกใช้งานต่อ ราคาอยู่ที่ ฿599 \/ เดือน \/ ร้าน/);
    assert.doesNotMatch(th, /ทดลองใช้ฟรี/);
    assert.doesNotMatch(en, /free trial/i);
    assert.doesNotMatch(th, /ทำไมร้านตัดผมเลือก/);
    assert.doesNotMatch(en, /why barbershops choose/i);
    assert.doesNotMatch(th, /ประมาณ 10 คน|สูงสุด 10 คน/);
    assert.doesNotMatch(en, /up to about 10 barbers|up to 10 barbers/i);
    assert.doesNotMatch(en, /about 10 barbers per shop/i);
    assert.doesNotMatch(th, /รายได้เพิ่มขึ้น|ไม่มาตามนัด/i);
    assert.doesNotMatch(en, /reminder before|before your appointment/i);
  });

  it("public marketing values do not name an unverified LINE sender", () => {
    const th = visibleValues("marketing.", "th");
    const en = visibleValues("marketing.", "en");
    assert.doesNotMatch(th, /BarberQx LINE OA/);
    assert.doesNotMatch(en, /BarberQx LINE OA/i);
    assert.doesNotMatch(th, /ข้อความยืนยันการจองผ่าน BarberQx/);
    assert.doesNotMatch(en, /confirmation messages through the BarberQx/i);
    assert.doesNotMatch(th, /ข้อความ(?:ยืนยัน)?(?:การจอง)?(?:ผ่าน|จาก) LINE OA ของร้าน/);
    assert.doesNotMatch(en, /shop(?:'s)? (?:LINE )?OA as sender/i);
    assert.doesNotMatch(en, /(?:messages?|confirmation) through the shop(?:'s)? LINE OA/i);
    assert.equal(
      dictionary.th["marketing.faq.5.a"],
      "หลังจอง คิวของคุณถูกบันทึกในระบบแล้ว ข้อความเพิ่มเติมใน LINE เป็นทางเลือก และไม่กระทบสถานะการจอง",
    );
    assert.equal(
      dictionary.en["marketing.faq.5.a"],
      "After you book, your queue is saved in the system. Any extra LINE message is optional and does not affect your booking status.",
    );
  });
});
