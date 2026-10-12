import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appointmentMatchesCode,
  bookingConfirmTriggerText,
  bookingShortCode,
  parseBookingCodeFromText,
} from "@/lib/line/booking-code";

describe("booking-code", () => {
  const id = "a12f3b44-1111-2222-3333-444455556666";

  it("builds short code and trigger text", () => {
    assert.equal(bookingShortCode(id), "A12F3B");
    assert.equal(bookingConfirmTriggerText(id), "จอง #A12F3B");
  });

  it("parses booking codes from chat text", () => {
    assert.equal(parseBookingCodeFromText("จอง #A12F3B"), "A12F3B");
    assert.equal(parseBookingCodeFromText("#a12f3b"), "A12F3B");
    assert.equal(parseBookingCodeFromText("hello"), null);
  });

  it("matches appointment ids", () => {
    assert.equal(appointmentMatchesCode(id, "A12F3B"), true);
    assert.equal(appointmentMatchesCode(id, "ZZZZZZ"), false);
  });
});
