import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";

describe("setup hours UX copy", () => {
  it("hours step header copy", () => {
    assert.equal(dictionary.th["onboarding.hoursTitle"], "ตั้งเวลาเปิด-ปิดของร้าน");
    assert.equal(
      dictionary.th["onboarding.hoursSubtitle"],
      "กำหนดวันและเวลาที่ร้านเปิดรับลูกค้า",
    );
  });

  it("default hours section copy", () => {
    assert.equal(dictionary.th["onboarding.defaultHoursTitle"], "เวลาเปิด-ปิดปกติ");
    assert.equal(
      dictionary.th["onboarding.defaultHoursDescription"],
      "ตั้งเวลาหลักของร้าน แล้วเลือกวันที่ใช้เวลานี้",
    );
    assert.equal(dictionary.th["onboarding.presetMonFri"], "จ.-ศ.");
    assert.equal(dictionary.th["onboarding.presetMonSat"], "จ.-ส.");
    assert.equal(dictionary.th["onboarding.presetAllDays"], "ทุกวัน");
    assert.equal(
      dictionary.th["onboarding.applyDefaultHours"],
      "ใช้เวลานี้กับวันที่เลือก",
    );
    assert.equal(dictionary.th["onboarding.hoursUpdated"], "อัปเดตเวลาแล้ว");
  });

  it("daily hours section copy", () => {
    assert.equal(dictionary.th["onboarding.dailyHoursTitle"], "เวลาของแต่ละวัน");
    assert.equal(
      dictionary.th["onboarding.dailyHoursDescription"],
      "แก้ไขเฉพาะวันที่เวลาไม่เหมือนปกติ",
    );
    assert.equal(dictionary.th["onboarding.shopOpen"], "ร้านเปิด");
    assert.equal(dictionary.th["onboarding.editDay"], "แก้ไข");
  });

  it("day row labels", () => {
    assert.equal(dictionary.th["onboarding.openTime"], "เวลาเปิด");
    assert.equal(dictionary.th["onboarding.closeTime"], "เวลาปิด");
    assert.equal(dictionary.th["onboarding.dayClosed"], "ร้านปิดวันนี้");
    assert.equal(dictionary.th["onboarding.dayClosedHint"], "ร้านปิดวันนี้");
  });
});
