import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  applyOptimisticToggle,
  rollbackOptimisticToggle,
  shouldShowOwnerSlotDuration,
} from "@/lib/onboarding/optimistic-bookable";

describe("setup team UX copy", () => {
  it("owner bookable copy is clear", () => {
    assert.equal(
      dictionary.th["onboarding.ownerBookable"],
      "คุณเป็นช่างในร้านด้วย",
    );
    assert.equal(
      dictionary.th["onboarding.ownerBookableHint"],
      "เปิดข้อนี้ถ้าคุณตัดผมด้วย และต้องการให้ลูกค้าจองคิวกับคุณได้",
    );
    assert.equal(dictionary.th["onboarding.ownerRole"], "ผู้ดูแลร้าน");
  });

  it("add barber section heading and hint", () => {
    assert.equal(dictionary.th["onboarding.addBarberHeading"], "เพิ่มช่างในร้าน");
    assert.equal(
      dictionary.th["onboarding.addBarberHint"],
      "เพิ่มช่างที่ลูกค้าสามารถเลือกจองคิวได้",
    );
  });

  it("duration and barber name labels", () => {
    assert.equal(dictionary.th["onboarding.slotDuration"], "เวลาต่อคิว");
    assert.equal(
      dictionary.th["onboarding.slotDurationHint"],
      "ระยะเวลาที่กันไว้สำหรับลูกค้า 1 คน",
    );
    assert.equal(dictionary.th["onboarding.barberName"], "ชื่อช่าง");
  });
});

describe("setup team UX helpers", () => {
  it("duration hidden when owner bookable OFF", () => {
    assert.equal(shouldShowOwnerSlotDuration(false), false);
    assert.equal(shouldShowOwnerSlotDuration(true), true);
  });

  it("optimistic toggle applies immediately", () => {
    assert.equal(applyOptimisticToggle(false), true);
    assert.equal(applyOptimisticToggle(true), false);
  });

  it("optimistic toggle rollback restores previous", () => {
    const previous = false;
    const optimistic = applyOptimisticToggle(previous);
    assert.equal(optimistic, true);
    assert.equal(rollbackOptimisticToggle(previous), false);
  });
});
