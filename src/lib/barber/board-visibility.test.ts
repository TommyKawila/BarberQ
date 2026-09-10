import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { selectAdminBoardBarbers } from "@/lib/barber/board-visibility";
import { getAdminDay } from "@/lib/services/booking-service";
import type { StaffAuth } from "@/lib/admin-auth";

function barber(id: string, overrides: { is_active?: boolean; is_bookable?: boolean } = {}) {
  return {
    id,
    name: id,
    slot_duration_minutes: 30,
    off_days: [],
    created_at: "",
    ...overrides,
  };
}

describe("admin board barber visibility", () => {
  it("active+bookable shown", () => {
    const result = selectAdminBoardBarbers(
      [barber("open", { is_bookable: true })],
      new Set(),
      false,
    );
    assert.deepEqual(result.map((b) => b.id), ["open"]);
  });

  it("active+nonbookable hidden by default", () => {
    const result = selectAdminBoardBarbers(
      [barber("closed", { is_bookable: false })],
      new Set(),
      false,
    );
    assert.equal(result.length, 0);
  });

  it("active+nonbookable with booking today shown", () => {
    const result = selectAdminBoardBarbers(
      [barber("closed", { is_bookable: false })],
      new Set(["closed"]),
      false,
    );
    assert.deepEqual(result.map((b) => b.id), ["closed"]);
  });

  it("inactive hidden even with booking and filter", () => {
    const result = selectAdminBoardBarbers(
      [barber("gone", { is_active: false, is_bookable: false })],
      new Set(["gone"]),
      true,
    );
    assert.equal(result.length, 0);
  });

  it("filter includes active nonbookable", () => {
    const result = selectAdminBoardBarbers(
      [barber("closed", { is_bookable: false })],
      new Set(),
      true,
    );
    assert.deepEqual(result.map((b) => b.id), ["closed"]);
  });

  it("filter never includes inactive", () => {
    const result = selectAdminBoardBarbers(
      [
        barber("open", { is_bookable: true }),
        barber("closed", { is_bookable: false }),
        barber("gone", { is_active: false }),
      ],
      new Set(),
      true,
    );
    assert.deepEqual(result.map((b) => b.id), ["open", "closed"]);
  });

  it("getAdminDay for shop A does not include shop B barbers", async () => {
    const shopA = await memoryStore.createShop({
      name: "Board Shop A",
      ownerLineId: "U-board-a",
      ownerName: "Owner A",
      subscriptionMonths: 1,
    });
    const shopB = await memoryStore.createShop({
      name: "Board Shop B",
      ownerLineId: "U-board-b",
      ownerName: "Owner B",
      subscriptionMonths: 1,
    });
    const barberA = await memoryStore.createBarber({ shopId: shopA.id, name: "A Barber" });
    await memoryStore.createBarber({ shopId: shopB.id, name: "B Barber" });
    const owners = await memoryStore.listBarbersByShop(shopA.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner);
    const staff: StaffAuth = {
      staffId: owner.id,
      name: owner.name,
      role: "owner",
      barberId: owner.id,
      shopId: shopA.id,
    };
    const columns = await getAdminDay("2026-06-02", shopA.id, staff);
    assert.ok(columns.some((col) => col.barber.id === barberA.id));
    assert.ok(!columns.some((col) => col.barber.shop_id === shopB.id));
  });

  it("getAdminDay hides closed barber without bookings unless filter on", async () => {
    const shop = await memoryStore.createShop({
      name: "Closed Board Shop",
      ownerLineId: "U-closed-board",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const closed = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Closed Only",
      isBookable: false,
    });
    const owners = await memoryStore.listBarbersByShop(shop.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner);
    const staff: StaffAuth = {
      staffId: owner.id,
      name: owner.name,
      role: "owner",
      barberId: owner.id,
      shopId: shop.id,
    };
    const defaultColumns = await getAdminDay("2026-06-02", shop.id, staff);
    assert.ok(!defaultColumns.some((col) => col.barber.id === closed.id));
    const withFilter = await getAdminDay("2026-06-02", shop.id, staff, new Date(), true);
    assert.ok(withFilter.some((col) => col.barber.id === closed.id));
  });
});
