import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertShopOwner, getStaffFromLineId, type StaffAuth } from "@/lib/admin-auth";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { dictionary } from "@/lib/i18n/dictionary";
import { listBookableBarbers } from "@/lib/services/booking-service";
import { BookingError } from "@/lib/services/booking-service";

const barberStaff: StaffAuth = {
  staffId: "b1",
  name: "Barber",
  role: "barber",
  barberId: "b1",
  shopId: "shop-a",
};

describe("remove barber from shop", () => {
  it("owner deactivates barber with no future bookings", async () => {
    const shop = await memoryStore.createShop({
      name: "Remove Shop",
      ownerLineId: "U-remove-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Gone Barber",
      lineId: "U-remove-barber",
    });
    const updated = await memoryStore.deactivateBarber(shop.id, barber.id);
    assert.equal(updated.is_active, false);
    assert.equal(updated.is_bookable, false);
    assert.equal(updated.line_id, null);
    const reloaded = await memoryStore.getBarber(barber.id);
    assert.ok(reloaded);
    assert.equal(reloaded.is_active, false);
  });

  it("inactive barber hidden from customer booking list", async () => {
    const shop = await memoryStore.createShop({
      name: "Hidden Shop",
      ownerLineId: "U-hidden-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Hidden Barber",
    });
    await memoryStore.deactivateBarber(shop.id, barber.id);
    const bookable = await listBookableBarbers(shop.id);
    assert.ok(!bookable.some((b) => b.id === barber.id));
  });

  it("historical appointments remain after removal", async () => {
    const shop = await memoryStore.createShop({
      name: "History Shop",
      ownerLineId: "U-history-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "History Barber",
    });
    const start = new Date("2020-01-01T10:00:00.000Z");
    const end = new Date("2020-01-01T11:00:00.000Z");
    const apt = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: "cust-hist",
      customerName: "Customer",
      customerPhone: "0800000000",
      startTime: start,
      endTime: end,
    });
    await memoryStore.deactivateBarber(shop.id, barber.id);
    const reloaded = await memoryStore.getAppointment(apt.id);
    assert.ok(reloaded);
    assert.equal(reloaded.barber_id, barber.id);
    assert.equal(reloaded.status, "confirmed");
  });

  it("future confirmed booking blocks removal", async () => {
    const shop = await memoryStore.createShop({
      name: "Future Shop",
      ownerLineId: "U-future-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Busy Barber",
    });
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: "cust-future",
      customerName: "Future",
      customerPhone: "0800000001",
      startTime: start,
      endTime: end,
    });
    await assert.rejects(
      () => memoryStore.deactivateBarber(shop.id, barber.id),
      (err: unknown) =>
        err instanceof StoreConflict &&
        err.code === "HAS_FUTURE_BOOKINGS" &&
        (err.count ?? 0) >= 1,
    );
    const stillActive = await memoryStore.getBarber(barber.id);
    assert.equal(stillActive?.is_active !== false, true);
  });

  it("owner cannot deactivate owner/self", async () => {
    const shop = await memoryStore.createShop({
      name: "Owner Shop",
      ownerLineId: "U-owner-self",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const owners = await memoryStore.listBarbersByShop(shop.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner);
    await assert.rejects(
      () => memoryStore.deactivateBarber(shop.id, owner.id),
      (err: unknown) => err instanceof StoreConflict && err.code === "NOT_OWNER",
    );
  });

  it("cross-shop removal rejected", async () => {
    const shopA = await memoryStore.createShop({
      name: "Shop A Remove",
      ownerLineId: "U-cross-a",
      ownerName: "Owner A",
      subscriptionMonths: 1,
    });
    const shopB = await memoryStore.createShop({
      name: "Shop B Remove",
      ownerLineId: "U-cross-b",
      ownerName: "Owner B",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({ shopId: shopA.id, name: "A Barber" });
    await assert.rejects(
      () => memoryStore.deactivateBarber(shopB.id, barber.id),
      (err: unknown) => err instanceof StoreConflict && err.code === "BARBER_NOT_FOUND",
    );
  });

  it("linked LINE no longer grants admin after removal", async () => {
    const shop = await memoryStore.createShop({
      name: "Line Shop",
      ownerLineId: "U-line-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Line Barber",
      lineId: "U-line-barber-remove",
    });
    await memoryStore.deactivateBarber(shop.id, barber.id);
    const staff = await getStaffFromLineId("U-line-barber-remove");
    assert.equal(staff, null);
  });

  it("reactivate restores active without restoring LINE", async () => {
    const shop = await memoryStore.createShop({
      name: "Restore Shop",
      ownerLineId: "U-restore-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Restore Barber",
      lineId: "U-restore-barber",
      isBookable: true,
    });
    await memoryStore.deactivateBarber(shop.id, barber.id);
    const restored = await memoryStore.reactivateBarber(shop.id, barber.id);
    assert.equal(restored.is_active, true);
    assert.equal(restored.line_id, null);
    assert.equal(restored.is_bookable, false);
  });

  it("barber cannot pass owner gate", () => {
    assert.throws(() => assertShopOwner(barberStaff), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("copy uses remove-from-shop wording not delete", () => {
    assert.equal(dictionary.th["admin.removeFromShop"], "นำออกจากร้าน");
    assert.ok(!dictionary.th["admin.removeFromShop"].includes("ลบ"));
    assert.equal(dictionary.th["admin.removedBarbersTitle"], "ช่างที่นำออกแล้ว");
  });
});
