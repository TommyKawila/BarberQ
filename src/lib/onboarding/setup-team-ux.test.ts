import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  applyOptimisticToggle,
  rollbackOptimisticToggle,
  shouldShowOwnerSlotDuration,
} from "@/lib/onboarding/optimistic-bookable";

describe("setup team UX copy", () => {
  it("owner section copy", () => {
    assert.equal(dictionary.th["onboarding.ownerSectionTitle"], "คุณในฐานะเจ้าของร้าน");
    assert.equal(dictionary.th["onboarding.ownerRole"], "ผู้ดูแลร้าน");
    assert.equal(dictionary.th["onboarding.ownerIsBarber"], "คุณเป็นช่างในร้านด้วย");
    assert.equal(
      dictionary.th["onboarding.ownerIsBarberDescription"],
      "เปิดข้อนี้ถ้าคุณตัดผมด้วย และต้องการให้ลูกค้าจองคิวกับคุณได้",
    );
    assert.equal(
      dictionary.th["onboarding.ownerOnlyDescription"],
      "คุณจะเป็นผู้ดูแลร้านอย่างเดียว",
    );
  });

  it("existing barbers section copy", () => {
    assert.equal(dictionary.th["onboarding.existingBarbersTitle"], "ช่างในร้าน");
    assert.equal(
      dictionary.th["onboarding.existingBarbersDescription"],
      "รายชื่อช่างที่ลูกค้าสามารถเลือกจองคิวได้",
    );
    assert.equal(dictionary.th["onboarding.barberCount"], "{count} คน");
    assert.equal(dictionary.th["onboarding.minutesPerSlot"], "{duration} นาทีต่อคิว");
    assert.equal(dictionary.th["onboarding.noBarbers"], "ยังไม่มีช่างในร้าน");
    assert.equal(
      dictionary.th["onboarding.noBarbersDescription"],
      "เพิ่มช่างด้านล่างเพื่อเริ่มรับจอง",
    );
  });

  it("add barber section copy", () => {
    assert.equal(dictionary.th["onboarding.addBarberTitle"], "เพิ่มช่างในร้าน");
    assert.equal(
      dictionary.th["onboarding.addBarberDescription"],
      "เพิ่มช่างที่ลูกค้าสามารถเลือกจองคิวได้",
    );
    assert.equal(dictionary.th["onboarding.barberName"], "ชื่อช่าง");
    assert.equal(dictionary.th["onboarding.slotDuration"], "เวลาต่อคิว");
    assert.equal(
      dictionary.th["onboarding.slotDurationDescription"],
      "ระยะเวลาที่กันไว้สำหรับลูกค้า 1 คน",
    );
    assert.equal(dictionary.th["onboarding.addBarberButton"], "เพิ่มช่าง");
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
