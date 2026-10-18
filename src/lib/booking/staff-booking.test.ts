import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import {
  BookingError,
  createBooking,
  createBookingForShop,
  createStaffBooking,
  getAvailableSlots,
  getAdminDay,
  markAppointmentOutcome,
} from "@/lib/services/booking-service";
import { getStatsReport } from "@/lib/services/stats-service";
import { getBookableDates } from "@/lib/services/slot-service";
import type { StaffAuth } from "@/lib/admin-auth";

const PHINX_SHOP = "00000000-0000-0000-0000-000000000001";
const SAEB_ID = "11111111-1111-4111-8111-111111111111";
const TIDE_ID = "22222222-2222-4222-8222-222222222222";

const OWNER: StaffAuth = {
  staffId: "owner-test",
  name: "Owner",
  role: "owner",
  barberId: SAEB_ID,
  shopId: PHINX_SHOP,
  lineId: "owner-line",
};

async function firstFutureSlot(barberId: string, minAheadMs = 0) {
  const dates = getBookableDates();
  const earliest = Date.now() + minAheadMs;
  for (const dateISO of dates) {
    const slots = await getAvailableSlots(barberId, dateISO);
    const available = slots.find(
      (s) => s.available && new Date(s.startTime).getTime() > earliest,
    );
    if (available) return available;
  }
  return null;
}

describe("staff booking + source (P3)", () => {
  it("walk-in nameless creates Walk-in #N without phone or LINE ref", async () => {
    const apt = await createStaffBooking(PHINX_SHOP, {
      barberId: SAEB_ID,
      startTime: new Date().toISOString(),
      source: "walk_in",
    });
    assert.match(apt.customer_name, /^Walk-in #\d+$/);
    assert.equal(apt.customer_phone, null);
    assert.equal(apt.customer_ref, null);
    assert.equal(apt.source, "walk_in");
    assert.equal(apt.status, "confirmed");
  });

  it("phone staff booking requires name and locks slot against LINE booking", async () => {
    const slot = await firstFutureSlot(TIDE_ID);
    assert.ok(slot);

    const staffApt = await createStaffBooking(PHINX_SHOP, {
      barberId: TIDE_ID,
      startTime: slot!.startTime,
      source: "phone",
      customerName: "โทรมา",
      customerPhone: "0812345678",
    });
    assert.equal(staffApt.source, "phone");
    assert.equal(staffApt.customer_name, "โทรมา");

    await assert.rejects(
      () =>
        createBooking({
          barberId: TIDE_ID,
          startTime: slot!.startTime,
          customerName: "LINE Customer",
          customerPhone: "0899999999",
          customerRef: "line-cross-source",
          customerLineId: "line-cross-source",
        }),
      (err: unknown) => err instanceof BookingError && err.code === "SLOT_TAKEN",
    );
  });

  it("chat staff booking and walk-in both conflict with each other", async () => {
    const otherShop = await memoryStore.createShop({
      name: "P3 Conflict Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: otherShop.id,
      name: "ConflictBarber",
      slotDuration: 30,
    });
    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);

    await createStaffBooking(otherShop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "chat",
      customerName: "Chatty",
    });

    await assert.rejects(
      () =>
        createStaffBooking(otherShop.id, {
          barberId: barber.id,
          startTime: slot!.startTime,
          source: "walk_in",
        }),
      (err: unknown) => err instanceof BookingError && err.code === "SLOT_TAKEN",
    );
  });

  it("tenant isolation: staff booking rejected for other shop barber", async () => {
    const otherShop = await memoryStore.createShop({
      name: "P3 Tenant Shop",
      subscriptionMonths: 1,
    });
    const otherBarber = await memoryStore.createBarber({
      shopId: otherShop.id,
      name: "OtherP3",
      slotDuration: 30,
    });
    await assert.rejects(
      () =>
        createStaffBooking(PHINX_SHOP, {
          barberId: otherBarber.id,
          startTime: new Date().toISOString(),
          source: "walk_in",
        }),
      (err: unknown) => err instanceof BookingError && err.code === "BARBER_NOT_FOUND",
    );
  });

  it("status transitions: completed early and left free the remaining slot", async () => {
    const shop = await memoryStore.createShop({
      name: "P3 Outcome Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "OutcomeBarber",
      slotDuration: 30,
    });
    const start = new Date();
    const walkIn = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: start.toISOString(),
      source: "walk_in",
    });
    assert.ok(new Date(walkIn.end_time).getTime() > Date.now());

    const left = await markAppointmentOutcome(walkIn.id, "left");
    assert.equal(left.status, "left");
    assert.ok(new Date(left.end_time).getTime() <= Date.now() + 1000);

    const again = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: new Date().toISOString(),
      source: "walk_in",
    });
    assert.equal(again.source, "walk_in");

    const done = await markAppointmentOutcome(again.id, "completed");
    assert.equal(done.status, "completed");
    assert.ok(done.completed_at);
  });

  it("left on future appointment keeps end_time valid and frees slot", async () => {
    const shop = await memoryStore.createShop({
      name: "P3 Future Left Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "FutureLeftBarber",
      slotDuration: 30,
    });
    // createStaffBooking snaps walk-ins within 2 minutes of "now" down to the
    // current 5-minute bucket — pick a slot far enough ahead to keep the
    // requested start_time (otherwise this flakes near slot boundaries).
    const slot = await firstFutureSlot(barber.id, 3 * 60_000);
    assert.ok(slot);
    assert.ok(new Date(slot!.startTime).getTime() > Date.now() + 3 * 60_000);

    const walkIn = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "walk_in",
    });
    const originalEnd = walkIn.end_time;
    assert.equal(walkIn.start_time, slot!.startTime);
    assert.ok(new Date(walkIn.start_time).getTime() > Date.now());

    const left = await markAppointmentOutcome(walkIn.id, "left");
    assert.equal(left.status, "left");
    assert.equal(left.end_time, originalEnd);
    assert.ok(new Date(left.end_time).getTime() > new Date(left.start_time).getTime());

    // left does not block overlap — same slot bookable again
    const again = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "phone",
      customerName: "After Left",
    });
    assert.equal(again.status, "confirmed");
    assert.equal(again.source, "phone");
  });

  it("no_show rejected for walk-in", async () => {
    const shop = await memoryStore.createShop({
      name: "P3 NoShow Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "NoShowBarber",
      slotDuration: 30,
    });
    const walkIn = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: new Date().toISOString(),
      source: "walk_in",
    });
    await assert.rejects(
      () => markAppointmentOutcome(walkIn.id, "no_show"),
      (err: unknown) => err instanceof BookingError && err.code === "INVALID_OUTCOME",
    );
  });

  it("admin board shows source on booked slots", async () => {
    const shop = await memoryStore.createShop({
      name: "P3 Board Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "BoardBarber",
      slotDuration: 30,
    });
    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);
    await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "phone",
      customerName: "Board Phone",
    });
    const dateISO = slot!.startTime.slice(0, 10);
    // dateISOFromInstant may differ from UTC slice — use Bangkok day from service path
    const staff: StaffAuth = {
      ...OWNER,
      shopId: shop.id,
      barberId: barber.id,
      role: "owner",
    };
    // Try nearby dateISOs from bookable window
    const dates = getBookableDates();
    let found = false;
    for (const d of dates) {
      const columns = await getAdminDay(d, shop.id, staff);
      const col = columns.find((c) => c.barber.id === barber.id);
      const booked = col?.slots.find((s) => s.appointmentId && s.source === "phone");
      if (booked) {
        found = true;
        assert.equal(booked.customerName, "Board Phone");
        break;
      }
    }
    assert.equal(found, true);
    void dateISO;
  });

  it("admin board exposes per-customer noShowCount with warning threshold", async () => {
    const shop = await memoryStore.createShop({
      name: "P7 NoShow Board",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "NoShowBoardBarber",
      slotDuration: 30,
    });
    const phone = "0833333333";
    for (let i = 0; i < 2; i += 1) {
      const start = new Date(Date.now() - (i + 2) * 7 * 24 * 60 * 60_000);
      const past = await memoryStore.createAppointment({
        barberId: barber.id,
        customerName: "Repeat",
        customerPhone: phone,
        customerRef: `noshow-ref-${i}-${Date.now()}`,
        startTime: start,
        endTime: new Date(start.getTime() + 30 * 60_000),
        source: "phone",
      });
      await memoryStore.markAppointmentOutcome(past.id, "no_show");
    }

    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);
    await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "phone",
      customerName: "Repeat",
      customerPhone: phone,
    });
    const staff: StaffAuth = {
      ...OWNER,
      shopId: shop.id,
      barberId: barber.id,
      role: "owner",
    };
    const dates = getBookableDates();
    let count: number | undefined;
    for (const d of dates) {
      const columns = await getAdminDay(d, shop.id, staff);
      const col = columns.find((c) => c.barber.id === barber.id);
      const booked = col?.slots.find((s) => s.customerPhone === phone && s.kind === "booked");
      if (booked) {
        count = booked.noShowCount;
        break;
      }
    }
    assert.equal(count, 2);
  });

  it("stats separate by source; walkIns match bySource when no legacy blocks", async () => {
    const shop = await memoryStore.createShop({
      name: "P3 Stats Shop",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "StatsBarber",
      slotDuration: 30,
    });
    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);
    await createBookingForShop(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      customerName: "Line User",
      customerPhone: "0811111111",
      customerRef: "line-stats-1",
      customerLineId: "line-stats-1",
    });
    // Pick a later free slot so walk-in never collides with the LINE booking above
    const walkInSlot = await firstFutureSlot(barber.id);
    assert.ok(walkInSlot);
    await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: walkInSlot!.startTime,
      source: "walk_in",
    });
    const staff: StaffAuth = {
      ...OWNER,
      shopId: shop.id,
      barberId: barber.id,
    };
    // Use month (not week-of-today): near Sunday midnight, firstFutureSlot can
    // land next Monday while week-of-getBookableDates()[0] still ends Sunday.
    const anchorISO = getBookableDates()[0]!;
    const report = await getStatsReport("month", anchorISO, staff);
    assert.ok(report.totals.bySource.line >= 1);
    assert.ok(report.totals.bySource.walk_in >= 1);
    assert.equal(report.totals.walkIns, report.totals.bySource.walk_in);
  });
});
