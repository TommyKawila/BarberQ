import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { getStatsReport, isLegacyWalkInBlock } from "@/lib/services/stats-service";
import {
  createBlock,
  createStaffBooking,
  getAvailableSlots,
  markAppointmentOutcome,
} from "@/lib/services/booking-service";
import { dateISOFromInstant, getBookableDates } from "@/lib/services/slot-service";
import type { StaffAuth } from "@/lib/admin-auth";
import type { Slot } from "@/types/booking";

async function firstFutureSlot(barberId: string) {
  const dates = getBookableDates();
  for (const dateISO of dates) {
    const slots = await getAvailableSlots(barberId, dateISO);
    const available = slots.find((s: Slot) => s.available);
    if (available) return available;
  }
  return null;
}

describe("stats-service D5 KPIs", () => {
  beforeEach(() => {
    // memory store is process-global; create isolated shop per test
  });

  it("snapshots price on completed and reports revenue + returning rate", async () => {
    const shop = await memoryStore.createShop({
      name: `D5 Stats ${Date.now()}`,
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: `StatsBarber${Date.now()}`,
      slotDuration: 30,
    });
    await memoryStore.createShopService({
      shopId: shop.id,
      name: "ตัดผม",
      priceBaht: 250,
      isDefault: true,
    });

    const staff: StaffAuth = {
      staffId: "owner-d5",
      name: "Owner",
      role: "owner",
      barberId: barber.id,
      shopId: shop.id,
      lineId: "owner-d5",
    };

    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);

    const booking = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "phone",
      customerName: "Returning",
      customerPhone: "0811111111",
    });

    // Prior visit for returning customer
    await memoryStore.createAppointment({
      barberId: barber.id,
      customerName: "Returning",
      customerPhone: "0811111111",
      customerRef: "prior-ref",
      startTime: new Date(Date.now() - 14 * 24 * 60 * 60_000),
      endTime: new Date(Date.now() - 14 * 24 * 60 * 60_000 + 30 * 60_000),
      source: "line",
    });

    const done = await markAppointmentOutcome(booking.id, "completed");
    assert.equal(done.price_baht, 250);
    assert.ok(done.service_id);

    const dateISO = dateISOFromInstant(new Date(slot!.startTime));
    const report = await getStatsReport("week", dateISO, staff);
    assert.equal(report.totals.completed >= 1, true);
    assert.ok(report.totals.revenueBaht >= 250);
    assert.ok(report.totals.returningRatePct != null);
    assert.ok(report.comparison);
    assert.ok(Array.isArray(report.byHour));
    assert.ok(report.insight);
  });

  it("walkIns count source walk_in plus legacy walk-in blocks only", async () => {
    const shop = await memoryStore.createShop({
      name: `P7 WalkIn ${Date.now()}`,
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: `WalkBarber${Date.now()}`,
      slotDuration: 30,
    });
    const staff: StaffAuth = {
      staffId: "owner-p7w",
      name: "Owner",
      role: "owner",
      barberId: barber.id,
      shopId: shop.id,
    };
    const walkSlot = await firstFutureSlot(barber.id);
    assert.ok(walkSlot);
    await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: walkSlot!.startTime,
      source: "walk_in",
    });
    const phoneSlot = await firstFutureSlot(barber.id);
    assert.ok(phoneSlot);
    await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: phoneSlot!.startTime,
      source: "phone",
      customerName: "Phone",
      customerPhone: "0899999999",
    });
    // Legacy walk-in block + unrelated block (break/closed) in range
    const legacyStart = new Date(walkSlot!.startTime);
    legacyStart.setUTCHours(legacyStart.getUTCHours() + 5);
    const legacyEnd = new Date(legacyStart.getTime() + 30 * 60_000);
    await createBlock({
      barberId: barber.id,
      startTime: legacyStart.toISOString(),
      endTime: legacyEnd.toISOString(),
      reason: "walk-in",
    });
    const otherStart = new Date(legacyEnd.getTime() + 60 * 60_000);
    const otherEnd = new Date(otherStart.getTime() + 30 * 60_000);
    await createBlock({
      barberId: barber.id,
      startTime: otherStart.toISOString(),
      endTime: otherEnd.toISOString(),
      reason: "lunch",
    });

    assert.equal(isLegacyWalkInBlock("walk-in"), true);
    assert.equal(isLegacyWalkInBlock("lunch"), false);

    const dateISO = dateISOFromInstant(new Date(walkSlot!.startTime));
    const report = await getStatsReport("week", dateISO, staff);
    assert.ok(report.totals.bySource.walk_in >= 1);
    assert.ok(report.totals.bySource.phone >= 1);
    // walkIns = appointment walk_ins + exactly one legacy walk-in block (lunch ignored)
    assert.equal(report.totals.walkIns, report.totals.bySource.walk_in + 1);
  });

  it("cancel+no-show rate excludes headline booked emphasis", async () => {
    const shop = await memoryStore.createShop({
      name: `D5 Cancel ${Date.now()}`,
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: `CancelBarber${Date.now()}`,
      slotDuration: 30,
    });
    const staff: StaffAuth = {
      staffId: "owner-d5b",
      name: "Owner",
      role: "owner",
      barberId: barber.id,
      shopId: shop.id,
    };
    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot);
    const booking = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "chat",
      customerName: "Cancel Me",
    });
    await memoryStore.staffCancelAppointment(booking.id);
    const dateISO = dateISOFromInstant(new Date(slot!.startTime));
    const report = await getStatsReport("day", dateISO, staff);
    assert.equal(report.totals.cancelled >= 1, true);
    assert.ok(report.totals.cancelNoShowRatePct != null);
    assert.ok(report.totals.cancelNoShowRatePct! > 0);
    assert.ok(report.totals.noShowRatePct != null);
  });
});
