import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  reminderDisplayMessageKey,
  reminderLeadFromAppointment,
} from "@/lib/reminders/display";

describe("reminder display", () => {
  it("maps stored lead minutes to i18n keys", () => {
    assert.equal(reminderLeadFromAppointment(60), 60);
    assert.equal(reminderDisplayMessageKey(60), "booking.reminderLead.60");
    assert.equal(reminderDisplayMessageKey(30), "booking.reminderLead.30");
  });

  it("returns null for no reminder", () => {
    assert.equal(reminderLeadFromAppointment(null), null);
    assert.equal(reminderLeadFromAppointment(0), null);
    assert.equal(reminderDisplayMessageKey(null), null);
  });
});
