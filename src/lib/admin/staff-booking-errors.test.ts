import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  staffBookingErrorMessage,
  walkInAssessmentMessage,
} from "@/lib/admin/staff-booking-errors";

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
