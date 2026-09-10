import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionary } from "@/lib/i18n/dictionary";
import { memoryStore } from "@/lib/data/memory-store";
import { listBookableBarbers } from "@/lib/services/booking-service";
import {
  applyOptimisticBookable,
  canToggleBookable,
  getQueueStatusLabelKey,
  isBarberBookable,
  rollbackOptimisticBookable,
  shouldShowRemoveMenu,
  updateBarberBookableInList,
} from "@/lib/barber/optimistic-bookable";

describe("team queue status UX", () => {
  it("bookable=true renders เปิดรับคิว label key", () => {
    assert.equal(getQueueStatusLabelKey(true), "admin.queueOpen");
    assert.equal(dictionary.th[getQueueStatusLabelKey(true)], "เปิดรับคิว");
  });

  it("bookable=false renders ปิดรับคิว label key", () => {
    assert.equal(getQueueStatusLabelKey(false), "admin.queueClosed");
    assert.equal(dictionary.th[getQueueStatusLabelKey(false)], "ปิดรับคิว");
  });

  it("optimistic apply flips immediately", () => {
    assert.equal(applyOptimisticBookable(true), false);
    assert.equal(applyOptimisticBookable(false), true);
  });

  it("pending disables repeated toggle", () => {
    assert.equal(canToggleBookable(true), false);
    assert.equal(canToggleBookable(false), true);
  });

  it("success keeps optimistic state in list update", () => {
    const barbers = [
      { id: "b1", is_bookable: true },
      { id: "b2", is_bookable: false },
    ];
    const updated = updateBarberBookableInList(barbers, "b1", false);
    assert.equal(updated[0].is_bookable, false);
    assert.equal(updated[1].is_bookable, false);
  });

  it("failure rollback restores previous state", () => {
    const previous = true;
    const optimistic = applyOptimisticBookable(previous);
    assert.equal(optimistic, false);
    assert.equal(rollbackOptimisticBookable(previous), true);
  });

  it("removed barber uses neutral removed status copy", () => {
    assert.equal(dictionary.th["admin.removedBarberStatus"], "นำออกจากร้านแล้ว");
    assert.notEqual(dictionary.th["admin.removedBarberStatus"], dictionary.th["admin.queueClosed"]);
  });

  it("owner has no remove action in menu rule", () => {
    assert.equal(shouldShowRemoveMenu("owner"), false);
    assert.equal(shouldShowRemoveMenu("barber"), true);
  });

  it("customer booking list hides non-bookable and inactive barbers", async () => {
    const shop = await memoryStore.createShop({
      name: "Queue UX Shop",
      ownerLineId: "U-queue-ux-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const open = await memoryStore.createBarber({ shopId: shop.id, name: "Open Barber" });
    const closed = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Closed Barber",
      isBookable: false,
    });
    await memoryStore.deactivateBarber(shop.id, closed.id);
    const bookable = await listBookableBarbers(shop.id);
    assert.ok(bookable.some((b) => b.id === open.id));
    assert.ok(!bookable.some((b) => b.id === closed.id));
    assert.equal(isBarberBookable({ is_bookable: false }), false);
    assert.equal(isBarberBookable({ is_bookable: true }), true);
  });
});
