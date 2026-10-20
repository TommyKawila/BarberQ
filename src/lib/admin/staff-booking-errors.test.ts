import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  staffBookingErrorMessage,
  walkInAssessmentMessage,
  walkInDisabledLabel,
  walkInShopBannerLabel,
} from "@/lib/admin/staff-booking-errors";
import type { WalkInAssessment } from "@/lib/admin/walk-in-quick";

const t = (key: keyof typeof dictionary.th) => dictionary.th[key];

describe("staffBookingErrorMessage", () => {
  it("never returns raw English API SLOT_TAKEN text", () => {
    const msg = staffBookingErrorMessage("SLOT_TAKEN", t, {
      barberName: "Ken",
      timeLabel: "08:20",
      nextFreeLabel: "10:30",
    });
    assert.doesNotMatch(msg, /This slot is already booked/i);
    assert.match(msg, /Ken/);
    assert.match(msg, /08:20/);
    assert.match(msg, /10:30/);
  });

  it("SHOP_CLOSED uses Thai open-time hint", () => {
    const msg = staffBookingErrorMessage("SHOP_CLOSED", t, { openLabel: "10:30" });
    assert.doesNotMatch(msg, /Shop opens/i);
    assert.match(msg, /10:30/);
    assert.match(msg, /ยังไม่เปิด|เปิด/);
  });

  it("walkInAssessmentMessage for before-open matches required copy shape", () => {
    const msg = walkInAssessmentMessage(
      {
        kind: "shop_before_open",
        barberId: "ken",
        barberName: "Ken",
        openLabel: "10:30",
      },
      t,
    );
    assert.equal(msg, "ร้านยังไม่เปิด (เปิด 10:30)");
  });

  it("busy offer names barber and next free time", () => {
    const msg = walkInAssessmentMessage(
      {
        kind: "busy",
        barberId: "ken",
        barberName: "Ken",
        nextFreeLabel: "11:30",
        nextFreeStartTime: "x",
      },
      t,
    );
    assert.match(msg, /Ken/);
    assert.match(msg, /11:30/);
    assert.doesNotMatch(msg, /This slot/i);
  });
});

describe("walkInDisabledLabel (grid / iPad visible reasons)", () => {
  it("before open shows short Thai with open time", () => {
    assert.equal(
      walkInDisabledLabel(
        {
          kind: "shop_before_open",
          barberId: "ken",
          barberName: "Ken",
          openLabel: "10:30",
        },
        t,
      ),
      "ร้านยังไม่เปิด (เปิด 10:30)",
    );
  });

  it("after close / off day use short grid copy", () => {
    assert.equal(
      walkInDisabledLabel(
        {
          kind: "shop_after_close",
          barberId: "ken",
          barberName: "Ken",
          nextOpenLabel: "พรุ่งนี้ 10:30",
        },
        t,
      ),
      "ร้านปิดแล้ว",
    );
    assert.equal(
      walkInDisabledLabel(
        {
          kind: "shop_closed_day",
          barberId: "ken",
          barberName: "Ken",
          nextOpenLabel: "จันทร์ 10:30",
        },
        t,
      ),
      "วันนี้หยุด",
    );
    assert.equal(
      walkInDisabledLabel(
        { kind: "barber_off", barberId: "nick", barberName: "Nick" },
        t,
      ),
      "วันนี้หยุด",
    );
  });

  it("walkInShopBannerLabel prefers before-open when present", () => {
    const assessments: WalkInAssessment[] = [
      {
        kind: "shop_after_close",
        barberId: "a",
        barberName: "A",
        nextOpenLabel: "x",
      },
      {
        kind: "shop_before_open",
        barberId: "b",
        barberName: "B",
        openLabel: "10:30",
      },
    ];
    assert.equal(walkInShopBannerLabel(assessments, t), "ร้านยังไม่เปิด (เปิด 10:30)");
  });

  it("walkInShopBannerLabel is null when nothing shop-gated", () => {
    const assessments: WalkInAssessment[] = [
      {
        kind: "ok",
        barberId: "a",
        barberName: "A",
        startTime: "x",
        timeLabel: "11:00",
        fromOffer: false,
      },
      { kind: "barber_off", barberId: "b", barberName: "B" },
    ];
    assert.equal(walkInShopBannerLabel(assessments, t), null);
  });
});
