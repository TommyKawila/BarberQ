import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import {
  cancelQrQueueEntry,
  joinQrQueue,
  listShopWaitingQueue,
  markQrQueueLeft,
  resolveQrQueueBarberId,
  startQrQueueEntry,
} from "@/lib/queue/qr-queue-service";
import type { StaffAuth } from "@/lib/admin-auth";
import { pickFirstAvailableBarber } from "@/lib/queue/qr-queue-logic";
import type { ShopHours } from "@/lib/shop/shop-hours";

const ALL_DAY_OPEN: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "00:00",
  close: "23:59",
}));

async function freshShop(label: string) {
  const shop = await memoryStore.createShop({
    name: `QR ${label} ${Date.now()}-${Math.random().toString(16).slice(2)}`,
    subscriptionMonths: 1,
  });
  const settings = await memoryStore.getShopSettings(shop.id);
  await memoryStore.setShopSettings(shop.id, {
    ...settings,
    hours: ALL_DAY_OPEN.map((d) => ({ ...d })),
  });
  const barber = await memoryStore.createBarber({
    shopId: shop.id,
    name: "QR Barber",
    slotDuration: 30,
    isBookable: true,
  });
  const staff: StaffAuth = {
    staffId: `staff-${shop.id}`,
    name: "Owner",
    role: "owner",
    barberId: barber.id,
    shopId: shop.id,
  };
  return { shop, barber, staff };
}

async function shopAlwaysOpen(shopId: string) {
  const settings = await memoryStore.getShopSettings(shopId);
  await memoryStore.setShopSettings(shopId, {
    ...settings,
    hours: ALL_DAY_OPEN.map((d) => ({ ...d })),
  });
}

describe("qr-queue service ordering", () => {
  it("three joiners get positions 1/2/3; cancel/left move the rest up", async () => {
    const { shop } = await freshShop("order");
    const a = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `u1-${shop.id}`,
      customerName: "A",
    });
    const b = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `u2-${shop.id}`,
      customerName: "B",
    });
    const c = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `u3-${shop.id}`,
      customerName: "C",
    });
    // Re-list after all joins so positions are computed on the full waiting set.
    const joined = await listShopWaitingQueue(shop.id);
    assert.deepEqual(
      joined.map((row) => row.entry.customer_name),
      ["A", "B", "C"],
    );
    assert.deepEqual(
      joined.map((row) => row.position),
      [1, 2, 3],
    );
    assert.equal(a.entry.id, joined[0].entry.id);
    assert.equal(b.entry.id, joined[1].entry.id);
    assert.equal(c.entry.id, joined[2].entry.id);

    await cancelQrQueueEntry(shop.id, a.entry.id, {
      byCustomerLineId: a.entry.customer_line_id,
    });
    const waiting = await listShopWaitingQueue(shop.id);
    assert.equal(waiting.length, 2);
    assert.equal(waiting[0].entry.customer_line_id, b.entry.customer_line_id);
    assert.equal(waiting[0].position, 1);
    assert.equal(waiting[1].position, 2);

    await markQrQueueLeft(shop.id, waiting[0].entry.id);
    const afterLeft = await listShopWaitingQueue(shop.id);
    assert.equal(afterLeft.length, 1);
    assert.equal(afterLeft[0].entry.customer_line_id, c.entry.customer_line_id);
    assert.equal(afterLeft[0].position, 1);
  });
});

describe("qr-queue first-available assignment", () => {
  it("resolveQrQueueBarberId uses preferred barber when set", async () => {
    const { shop, barber, staff } = await freshShop("prefer");
    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "pref-1",
      customerName: "Pref",
      preferredBarberId: barber.id,
    });
    const resolved = await resolveQrQueueBarberId(shop.id, joined.entry, staff);
    assert.equal(resolved, barber.id);
  });

  it("startQrQueueEntry creates walk_in via_qr appointment; collision rejects", async () => {
    const { shop, barber, staff } = await freshShop("start");
    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "start-1",
      customerName: "QR Customer",
      preferredBarberId: barber.id,
    });
    const now = new Date();
    const result = await startQrQueueEntry(shop.id, joined.entry.id, staff, { now });
    assert.equal(result.appointment.source, "walk_in");
    assert.equal(result.appointment.via_qr, true);
    assert.equal(result.appointment.customer_line_id, "start-1");
    assert.equal(result.entry.status, "started");
    assert.equal(result.appointment.barber_id, barber.id);

    const joined2 = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "start-2",
      customerName: "QR Two",
      preferredBarberId: barber.id,
    });
    await assert.rejects(
      () =>
        startQrQueueEntry(shop.id, joined2.entry.id, staff, {
          now,
          allowShorten: false,
        }),
      (err: unknown) => {
        assert.ok(err && typeof err === "object" && "code" in err);
        assert.equal((err as { code: string }).code, "SLOT_TAKEN");
        return true;
      },
    );
  });

  it("pickFirstAvailable prefers longest free-now stretch", () => {
    const id = pickFirstAvailableBarber(
      [
        { barberId: "a", freeUntil: "2026-10-15T10:20:00.000Z", nextFreeAt: null },
        { barberId: "b", freeUntil: "2026-10-15T11:00:00.000Z", nextFreeAt: null },
      ],
      new Date("2026-10-15T10:00:00.000Z"),
    );
    assert.equal(id, "b");
  });

  it("first-available start skips busy barber and books a free one", async () => {
    const { createStaffBooking } = await import("@/lib/services/booking-service");
    const shop = await memoryStore.createShop({
      name: `QR FreePick ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    const ken = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Ken",
      slotDuration: 30,
      isBookable: true,
    });
    const peter = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Peter",
      slotDuration: 30,
      isBookable: true,
    });
    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: ken.id,
      shopId: shop.id,
    };
    const now = new Date();
    // Occupy Ken right now (like QA: Ken has a walk-in covering "now").
    await createStaffBooking(
      shop.id,
      {
        barberId: ken.id,
        startTime: now.toISOString(),
        source: "walk_in",
        customerName: "Ken Busy",
      },
      now,
    );

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `fa-${shop.id}`,
      customerName: "FirstAvail",
      preferredBarberId: null,
    });
    const result = await startQrQueueEntry(shop.id, joined.entry.id, staff, {
      now,
      allowShorten: true,
    });
    assert.equal(result.appointment.barber_id, peter.id);
    assert.equal(result.appointment.via_qr, true);
    assert.equal(result.entry.status, "started");
  });

  it("first-available with no free barber keeps waiting and returns Thai NO_BARBER_FREE", async () => {
    const { createStaffBooking, BookingError } = await import(
      "@/lib/services/booking-service"
    );
    const shop = await memoryStore.createShop({
      name: `QR NoFree ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    const only = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Solo",
      slotDuration: 30,
      isBookable: true,
    });
    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: only.id,
      shopId: shop.id,
    };
    const now = new Date();
    await createStaffBooking(
      shop.id,
      {
        barberId: only.id,
        startTime: now.toISOString(),
        source: "walk_in",
        customerName: "Occupying",
      },
      now,
    );

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `nofree-${shop.id}`,
      customerName: "Waiting",
    });
    await assert.rejects(
      () => startQrQueueEntry(shop.id, joined.entry.id, staff, { now }),
      (err: unknown) => {
        assert.ok(err instanceof BookingError);
        assert.equal(err.code, "NO_BARBER_FREE");
        assert.match(err.message, /ไม่มีช่างว่าง/);
        return true;
      },
    );
    const still = await listShopWaitingQueue(shop.id);
    assert.equal(still.length, 1);
    assert.equal(still[0].entry.status, "waiting");
  });

  it("first-available skips off-day barber (board หยุด) and returns Thai NO_BARBER_FREE", async () => {
    const { createStaffBooking, BookingError } = await import(
      "@/lib/services/booking-service"
    );
    const { fromZonedTime } = await import("date-fns-tz");
    const { getBangkokWeekday, SHOP_TIMEZONE } = await import(
      "@/lib/services/slot-service"
    );
    const shop = await memoryStore.createShop({
      name: `QR OffDay ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    // Pin to Wed 15:20 Bangkok — matches QA window where working chairs are full.
    const now = fromZonedTime("2026-10-14T15:20:00", SHOP_TIMEZONE);
    const weekday = getBangkokWeekday("2026-10-14");

    const ken = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Ken",
      slotDuration: 60,
      isBookable: true,
    });
    const nick = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Nick",
      slotDuration: 60,
      isBookable: true,
    });
    const peter = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Peter",
      slotDuration: 60,
      isBookable: true,
    });
    const robert = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Robert",
      slotDuration: 60,
      isBookable: true,
    });
    await memoryStore.updateBarber(robert.id, { offDays: [weekday] });

    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: ken.id,
      shopId: shop.id,
    };

    // Ken / Nick / Peter busy at now (QA: booked 15:20–17:00). Robert free but OFF.
    for (const barberId of [ken.id, nick.id, peter.id]) {
      await createStaffBooking(
        shop.id,
        {
          barberId,
          startTime: now.toISOString(),
          source: "walk_in",
          customerName: `Busy-${barberId}`,
        },
        now,
      );
    }

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `offday-${shop.id}`,
      customerName: "FirstAvail",
      preferredBarberId: null,
    });

    // Robert is free but OFF — must not be assigned; entry stays waiting.
    await assert.rejects(
      () => startQrQueueEntry(shop.id, joined.entry.id, staff, { now }),
      (err: unknown) => {
        assert.ok(err instanceof BookingError);
        assert.equal(err.code, "NO_BARBER_FREE");
        assert.match(err.message, /ตอนนี้ไม่มีช่างว่าง/);
        return true;
      },
    );
    const still = await listShopWaitingQueue(shop.id);
    assert.equal(still.length, 1);
    assert.equal(still[0].entry.status, "waiting");
    assert.equal(still[0].entry.assigned_barber_id, null);
  });

  it("preferred barber who is off today returns Thai BARBER_OFF and keeps waiting", async () => {
    const { BookingError } = await import("@/lib/services/booking-service");
    const { fromZonedTime } = await import("date-fns-tz");
    const { getBangkokWeekday, SHOP_TIMEZONE } = await import(
      "@/lib/services/slot-service"
    );
    const shop = await memoryStore.createShop({
      name: `QR PrefOff ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    const now = fromZonedTime("2026-10-14T15:20:00", SHOP_TIMEZONE);
    const weekday = getBangkokWeekday("2026-10-14");
    const robert = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Robert Pref",
      slotDuration: 60,
      isBookable: true,
    });
    await memoryStore.updateBarber(robert.id, { offDays: [weekday] });
    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: robert.id,
      shopId: shop.id,
    };

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `prefoff-${shop.id}`,
      customerName: "Wants Robert",
      preferredBarberId: robert.id,
    });
    await assert.rejects(
      () => startQrQueueEntry(shop.id, joined.entry.id, staff, { now }),
      (err: unknown) => {
        assert.ok(err instanceof BookingError);
        assert.equal(err.code, "BARBER_OFF");
        assert.match(err.message, /วันนี้หยุดงาน/);
        return true;
      },
    );
    const still = await listShopWaitingQueue(shop.id);
    assert.equal(still.length, 1);
    assert.equal(still[0].entry.status, "waiting");
  });

  it("first-available skips queue-closed (is_bookable false) barber", async () => {
    const { createStaffBooking, BookingError } = await import(
      "@/lib/services/booking-service"
    );
    const shop = await memoryStore.createShop({
      name: `QR ClosedToggle ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    const busy = await memoryStore.createBarber({
      shopId: shop.id,
      name: "BusyChair",
      slotDuration: 30,
      isBookable: true,
    });
    const closed = await memoryStore.createBarber({
      shopId: shop.id,
      name: "ClosedChair",
      slotDuration: 30,
      isBookable: false,
    });
    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: busy.id,
      shopId: shop.id,
    };
    const now = new Date();
    await createStaffBooking(
      shop.id,
      {
        barberId: busy.id,
        startTime: now.toISOString(),
        source: "walk_in",
        customerName: "Occupying",
      },
      now,
    );

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `closed-${shop.id}`,
      customerName: "Waiting",
    });
    await assert.rejects(
      () => startQrQueueEntry(shop.id, joined.entry.id, staff, { now }),
      (err: unknown) => {
        assert.ok(err instanceof BookingError);
        assert.equal(err.code, "NO_BARBER_FREE");
        return true;
      },
    );
    assert.ok(closed.id);
  });

  it("preferred barber SLOT_TAKEN offers shorten when gap allows", async () => {
    const { createStaffBooking, BookingError } = await import(
      "@/lib/services/booking-service"
    );
    const shop = await memoryStore.createShop({
      name: `QR Shorten ${Date.now()}`,
      subscriptionMonths: 1,
    });
    await shopAlwaysOpen(shop.id);
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "ShortenBarber",
      slotDuration: 30,
      isBookable: true,
    });
    const staff: StaffAuth = {
      staffId: `staff-${shop.id}`,
      name: "Owner",
      role: "owner",
      barberId: barber.id,
      shopId: shop.id,
    };
    const now = new Date();
    // Future booking 20 min ahead → walk-in-now can shorten into the gap.
    const futureStart = new Date(now.getTime() + 20 * 60_000);
    await createStaffBooking(
      shop.id,
      {
        barberId: barber.id,
        startTime: futureStart.toISOString(),
        source: "phone",
        customerName: "Booked Ahead",
        customerPhone: "0811111111",
      },
      now,
    );

    const joined = await joinQrQueue({
      shopId: shop.id,
      customerLineId: `short-${shop.id}`,
      customerName: "QR Short",
      preferredBarberId: barber.id,
    });
    await assert.rejects(
      () =>
        startQrQueueEntry(shop.id, joined.entry.id, staff, {
          now,
          allowShorten: true,
        }),
      (err: unknown) => {
        assert.ok(err instanceof BookingError);
        assert.equal(err.code, "SLOT_TAKEN");
        assert.ok(
          (err as { canShortenUntil?: string }).canShortenUntil,
        );
        assert.match(err.message, /ช่องนี้มีคิวอยู่แล้ว|เริ่มตัดแบบสั้น/);
        return true;
      },
    );
  });
});
