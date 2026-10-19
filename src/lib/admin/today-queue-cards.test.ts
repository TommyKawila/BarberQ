import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveTodayQueueCards } from "@/lib/admin/today-queue-cards";
import type { AdminColumn } from "@/types/booking";

function iso(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

describe("deriveTodayQueueCards", () => {
  it("marks cutting vs free with next up", () => {
    const now = new Date();
    now.setHours(10, 45, 0, 0);
    const columns: AdminColumn[] = [
      {
        barber: {
          id: "b1",
          name: "Ken",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
          is_bookable: true,
          is_active: true,
          role: "barber",
        },
        slots: [
          {
            startTime: iso(10, 30),
            endTime: iso(11, 0),
            available: false,
            kind: "booked",
            customerName: "คุณต้น",
            status: "confirmed",
            source: "line",
            appointmentId: "a1",
          },
          {
            startTime: iso(11, 0),
            endTime: iso(11, 30),
            available: false,
            kind: "booked",
            customerName: "คุณบอส",
            status: "confirmed",
            source: "walk_in",
            appointmentId: "a2",
          },
        ],
      },
      {
        barber: {
          id: "b2",
          name: "Nick",
          slot_duration_minutes: 45,
          off_days: [],
          created_at: "",
          is_bookable: true,
          is_active: true,
          role: "barber",
        },
        slots: [
          {
            startTime: iso(10, 30),
            endTime: iso(11, 15),
            available: true,
            kind: "free",
          },
          {
            startTime: iso(11, 15),
            endTime: iso(12, 0),
            available: false,
            kind: "booked",
            customerName: "Peter K.",
            status: "confirmed",
            source: "line",
            appointmentId: "a3",
          },
        ],
      },
    ];

    const cards = deriveTodayQueueCards(columns, now);
    assert.equal(cards.length, 2);
    assert.equal(cards[0].state, "cutting");
    assert.equal(cards[0].current?.customerName, "คุณต้น");
    assert.equal(cards[0].next?.customerName, "คุณบอส");
    assert.ok((cards[0].remainingMinutes ?? 0) > 0);
    assert.equal(cards[1].state, "free");
    assert.ok(cards[1].freeUntil);
    assert.equal(cards[1].next?.customerName, "Peter K.");
  });

  it("treats gap before next booking as free when past free cells are unavailable", () => {
    const now = new Date();
    now.setHours(10, 45, 0, 0);
    const columns: AdminColumn[] = [
      {
        barber: {
          id: "b3",
          name: "Saeb",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
        },
        slots: [
          {
            startTime: iso(10, 30),
            endTime: iso(11, 0),
            available: false,
            kind: "free",
          },
          {
            startTime: iso(11, 0),
            endTime: iso(11, 30),
            available: false,
            kind: "booked",
            customerName: "Peter K.",
            status: "confirmed",
            source: "phone",
            appointmentId: "a9",
          },
        ],
      },
    ];
    const cards = deriveTodayQueueCards(columns, now);
    assert.equal(cards[0].state, "free");
    assert.equal(cards[0].next?.customerName, "Peter K.");
  });
});
