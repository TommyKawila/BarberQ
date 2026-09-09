import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertShopOwner, canManageBarber, type StaffAuth } from "@/lib/admin-auth";
import { BookingError } from "@/lib/services/booking-service";

const PHINX_SHOP = "00000000-0000-0000-0000-000000000001";
const SAEB_ID = "11111111-1111-4111-8111-111111111111";
const TIDE_ID = "22222222-2222-4222-8222-222222222222";

const ownerA: StaffAuth = {
  staffId: SAEB_ID,
  name: "Owner A",
  role: "owner",
  barberId: SAEB_ID,
  shopId: PHINX_SHOP,
};

const barberA: StaffAuth = {
  staffId: TIDE_ID,
  name: "Barber A",
  role: "barber",
  barberId: TIDE_ID,
  shopId: PHINX_SHOP,
};

const barberB: StaffAuth = {
  staffId: "barber-b",
  name: "Barber B",
  role: "barber",
  barberId: "barber-b",
  shopId: "shop-b",
};

describe("shop setup authorization", () => {
  it("barber cannot pass owner gate", () => {
    assert.throws(() => assertShopOwner(barberA), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("owner can manage barber in same shop", async () => {
    const allowed = await canManageBarber(ownerA, TIDE_ID);
    assert.equal(allowed, true);
  });

  it("barber can only manage self", async () => {
    assert.equal(await canManageBarber(barberA, TIDE_ID), true);
    assert.equal(await canManageBarber(barberA, SAEB_ID), false);
  });

  it("shop mismatch blocks cross-shop management", async () => {
    assert.equal(await canManageBarber(ownerA, "barber-b"), false);
    assert.notEqual(ownerA.shopId, barberB.shopId);
  });
});
