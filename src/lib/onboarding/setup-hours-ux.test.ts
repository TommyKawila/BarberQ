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

  it("copy hours action copy", () => {
    assert.equal(
      dictionary.th["onboarding.copyHoursToAll"],
      "ใช้เวลาเดียวกันทุกวันที่เปิด",
    );
    assert.equal(
      dictionary.th["onboarding.copyHoursApplied"],
      "ใช้เวลาเดียวกันกับวันที่เปิดแล้ว",
    );
  });

  it("day row labels", () => {
    assert.equal(dictionary.th["onboarding.openTime"], "เวลาเปิด");
    assert.equal(dictionary.th["onboarding.closeTime"], "เวลาปิด");
    assert.equal(dictionary.th["onboarding.dayClosed"], "ร้านปิดวันนี้");
    assert.equal(dictionary.th["onboarding.dayClosedHint"], "ร้านปิดวันนี้");
  });
});
