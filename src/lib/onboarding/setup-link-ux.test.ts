import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";

describe("setup link UX copy", () => {
  it("booking link section copy", () => {
    assert.equal(
      dictionary.th["onboarding.bookingLinkTitle"],
      'นำลิงก์นี้ไปสร้างปุ่ม "กดจองคิว" ใน LINE OA ของร้าน',
    );
    assert.equal(
      dictionary.th["onboarding.bookingLinkHint"],
      "เมื่อลูกค้ากดปุ่มนี้ ระบบจะเปิดหน้าจองคิวของร้านคุณทันที",
    );
    assert.equal(dictionary.th["onboarding.copyBookingLink"], "คัดลอกลิงก์จอง");
  });

  it("oa guide steps", () => {
    assert.equal(
      dictionary.th["onboarding.oaGuideTitle"],
      'วิธีสร้างปุ่ม "กดจองคิว" ใน LINE OA',
    );
    assert.equal(
      dictionary.th["onboarding.oaStep1"],
      "เปิด LINE Official Account Manager",
    );
    assert.equal(
      dictionary.th["onboarding.oaStep2"],
      "เลือกบัญชี LINE OA ของร้าน",
    );
    assert.equal(dictionary.th["onboarding.oaStep9"], "กดบันทึกและเปิดใช้งาน Rich Menu");
  });

  it("help section copy", () => {
    assert.equal(dictionary.th["onboarding.oaHelpTitle"], "ติดตั้งไม่เป็น?");
    assert.equal(
      dictionary.th["onboarding.oaHelpHint"],
      'ส่งข้อความหาเราได้เลย ทีม BarberQ ช่วยตั้งปุ่ม "กดจองคิว" ใน LINE OA ของร้านให้ได้',
    );
    assert.equal(dictionary.th["onboarding.oaHelpCta"], "แชทกับ BarberQ");
  });
});
