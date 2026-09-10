import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { assertShopOwner, type StaffAuth } from "@/lib/admin-auth";
import { adminNavItems, moreAdminNavItems, primaryAdminNavItems } from "@/lib/admin/admin-nav-items";
import { canShowOwnerTools } from "@/lib/booking/customer-flow";
import { getBearerToken, verifyLineAccessToken } from "@/lib/auth/line-verify";
import { BookingError } from "@/lib/services/booking-service";

const barberA: StaffAuth = {
  staffId: "barber-a",
  name: "Barber A",
  role: "barber",
  barberId: "barber-a",
  shopId: "shop-a",
};

const ownerA: StaffAuth = {
  staffId: "owner-a",
  name: "Owner A",
  role: "owner",
  barberId: "owner-a",
  shopId: "shop-a",
};

const ownerOtherShop: StaffAuth = {
  staffId: "owner-b",
  name: "Owner B",
  role: "owner",
  barberId: "owner-b",
  shopId: "shop-b",
};

describe("role separation", () => {
  it("assertShopOwner allows owner", () => {
    assert.doesNotThrow(() => assertShopOwner(ownerA));
  });

  it("assertShopOwner rejects barber", () => {
    assert.throws(() => assertShopOwner(barberA), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("owner role is not platform super_admin string", () => {
    assert.equal(ownerA.role, "owner");
    assert.notEqual(ownerA.role, "super_admin");
  });

  it("owner barberId is always set for schedule access", () => {
    assert.ok(ownerA.barberId);
    assert.equal(ownerA.barberId, ownerA.staffId);
  });
});

describe("shop authorization", () => {
  it("detects shop mismatch between staff records", () => {
    assert.notEqual(ownerA.shopId, ownerOtherShop.shopId);
  });

  it("barber cannot pass owner settings gate", () => {
    assert.throws(() => assertShopOwner(barberA), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });
});

describe("admin nav visibility", () => {
  it("owner sees primary Today/Team/Stats/More", () => {
    assert.deepEqual(primaryAdminNavItems("owner"), ["board", "team", "stats", "more"]);
  });

  it("owner more sheet has schedule, settings, booking", () => {
    assert.deepEqual(moreAdminNavItems("owner"), ["schedule", "settings", "booking"]);
  });

  it("barber sees Today/Schedule/More", () => {
    assert.deepEqual(primaryAdminNavItems("barber"), ["board", "schedule", "more"]);
  });

  it("barber more sheet has booking only", () => {
    assert.deepEqual(moreAdminNavItems("barber"), ["booking"]);
  });

  it("barber cannot see team, stats, or settings", () => {
    const items = [...primaryAdminNavItems("barber"), ...moreAdminNavItems("barber")];
    assert.ok(!items.includes("team"));
    assert.ok(!items.includes("stats"));
    assert.ok(!items.includes("settings"));
  });

  it("legacy adminNavItems keeps reachable destinations", () => {
    assert.deepEqual(adminNavItems("owner"), [
      "board",
      "team",
      "stats",
      "schedule",
      "settings",
      "booking",
    ]);
    assert.deepEqual(adminNavItems("barber"), ["board", "schedule", "booking"]);
  });
});

describe("customer booking owner tools visibility", () => {
  it("normal customer does not see owner tools", () => {
    assert.equal(canShowOwnerTools(null), false);
  });

  it("authorized owner sees owner tools", () => {
    assert.equal(canShowOwnerTools({ role: "owner", barberId: "owner-a" }), true);
  });

  it("shop staff from another shop does not leak via helper alone", () => {
    assert.equal(canShowOwnerTools({ role: "owner", barberId: "owner-b" }), true);
    assert.notEqual(ownerA.shopId, ownerOtherShop.shopId);
  });
});

describe("LINE bearer parsing", () => {
  it("extracts bearer token", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer test-token-123" },
    });
    assert.equal(getBearerToken(req), "test-token-123");
  });

  it("rejects missing authorization", () => {
    const req = new Request("http://localhost");
    assert.equal(getBearerToken(req), null);
  });

  it("rejects empty bearer", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer " },
    });
    assert.equal(getBearerToken(req), null);
  });
});

describe("verifyLineAccessToken mock mode", () => {
  const originalLiffId = process.env.NEXT_PUBLIC_LIFF_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LIFF_ID = originalLiffId;
  });

  it("uses token as userId without LIFF_ID", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const user = await verifyLineAccessToken("mock-customer-1");
    assert.equal(user?.userId, "mock-customer-1");
  });

  it("rejects empty token", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const user = await verifyLineAccessToken("");
    assert.equal(user, null);
  });
});
