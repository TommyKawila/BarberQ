import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildWebPushPayload } from "@/lib/webpush/notify";
import type { Appointment } from "@/types/booking";

const appointment: Appointment = {
  id: "apt-1",
  barber_id: "b1",
  customer_ref: "U1",
  customer_name: "คุณบี",
  customer_phone: "0812345678",
  start_time: "2026-10-14T07:30:00.000Z",
  end_time: "2026-10-14T08:00:00.000Z",
  status: "confirmed",
  created_at: "2026-10-12T00:00:00.000Z",
  source: "line",
};

describe("webpush payload privacy", () => {
  it("never includes customer phone", () => {
    const neu = buildWebPushPayload({
      event: "new_booking",
      shopName: "Kawila Cut",
      shopSlug: "kawila",
      appointment,
      barberName: "นัท",
    });
    const cancel = buildWebPushPayload({
      event: "cancel",
      shopName: "Kawila Cut",
      shopSlug: "kawila",
      appointment,
      barberName: "นัท",
    });
    assert.doesNotMatch(neu.body, /0812345678|0\d{8,9}/);
    assert.doesNotMatch(cancel.body, /0812345678|0\d{8,9}/);
    assert.match(neu.body, /คุณบี/);
    assert.match(neu.body, /จองใหม่/);
    assert.match(cancel.body, /ยกเลิก/);
  });
});
