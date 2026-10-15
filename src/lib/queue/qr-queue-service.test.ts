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

async function freshShop(label: string) {
  const shop = await memoryStore.createShop({
    name: `QR ${label} ${Date.now()}-${Math.random().toString(16).slice(2)}`,
    subscriptionMonths: 1,
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

describe("qr-queue service ordering", () => {
  it("three joiners get positions 1/2/3; cancel/left move the rest up", async () => {
    const { shop } = await freshShop("order");
    const a = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "u1",
      customerName: "A",
    });
    const b = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "u2",
      customerName: "B",
    });
    const c = await joinQrQueue({
      shopId: shop.id,
      customerLineId: "u3",
      customerName: "C",
    });
    assert.equal(a.position, 1);
    assert.equal(b.position, 2);
    assert.equal(c.position, 3);

    await cancelQrQueueEntry(shop.id, a.entry.id, { byCustomerLineId: "u1" });
    const waiting = await listShopWaitingQueue(shop.id);
    assert.equal(waiting.length, 2);
    assert.equal(waiting[0].entry.customer_line_id, "u2");
    assert.equal(waiting[0].position, 1);
    assert.equal(waiting[1].position, 2);

    await markQrQueueLeft(shop.id, waiting[0].entry.id);
    const afterLeft = await listShopWaitingQueue(shop.id);
    assert.equal(afterLeft.length, 1);
    assert.equal(afterLeft[0].entry.customer_line_id, "u3");
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
});
