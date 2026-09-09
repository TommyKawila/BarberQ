import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { assertShopOwner, canManageBarber, type StaffAuth } from "@/lib/admin-auth";
import { BookingError } from "@/lib/services/booking-service";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import {
  deriveShopActivation,
  firstIncompleteSetupStep,
} from "@/lib/onboarding/activation";
import { getShopActivation } from "@/lib/onboarding/shop-activation-service";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";

const PHINX_SHOP = "00000000-0000-0000-0000-000000000001";
const SAEB_ID = "11111111-1111-4111-8111-111111111111";

describe("deriveShopActivation", () => {
  it("claimed owner with non-bookable only is incomplete team", () => {
    const activation = deriveShopActivation({
      shopStatus: "active",
      shopName: "Test Shop",
      hours: DEFAULT_SHOP_HOURS,
      barbers: [
        {
          id: "owner-1",
          name: "Owner",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
          role: "owner",
          shop_id: PHINX_SHOP,
          is_bookable: false,
        },
      ],
      appointmentCount: 0,
    });
    assert.equal(activation.claimed, true);
    assert.equal(activation.teamOk, false);
    assert.equal(activation.ready, false);
    assert.equal(firstIncompleteSetupStep(activation), "team");
  });

  it("valid bookable barber completes team", () => {
    const activation = deriveShopActivation({
      shopStatus: "active",
      shopName: "Shop",
      hours: DEFAULT_SHOP_HOURS,
      barbers: [
        {
          id: SAEB_ID,
          name: "Saeb",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
          is_bookable: true,
        },
      ],
      appointmentCount: 0,
    });
    assert.equal(activation.teamOk, true);
    assert.equal(activation.ready, true);
  });

  it("all closed days makes hours incomplete", () => {
    const closed = DEFAULT_SHOP_HOURS.map((d) => ({ ...d, closed: true }));
    const activation = deriveShopActivation({
      shopStatus: "active",
      shopName: "Shop",
      hours: closed,
      barbers: [
        {
          id: SAEB_ID,
          name: "Saeb",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
          is_bookable: true,
        },
      ],
      appointmentCount: 0,
    });
    assert.equal(activation.hoursOk, false);
    assert.equal(activation.ready, false);
  });

  it("ready does not require first booking", () => {
    const activation = deriveShopActivation({
      shopStatus: "active",
      shopName: "Shop",
      hours: DEFAULT_SHOP_HOURS,
      barbers: [
        {
          id: SAEB_ID,
          name: "Saeb",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: "",
          is_bookable: true,
        },
      ],
      appointmentCount: 0,
    });
    assert.equal(activation.ready, true);
    assert.equal(activation.hasFirstBooking, false);
  });
});

describe("shop activation service", () => {
  it("PHINX seed is ready", async () => {
    const shop = await memoryStore.getShopBySlug("phinxstudio");
    assert.ok(shop);
    const activation = await getShopActivation(shop);
    assert.equal(activation.claimed, true);
    assert.equal(activation.teamOk, true);
    assert.equal(activation.ready, true);
  });

  it("new shop with owner only is not ready", async () => {
    const shop = await memoryStore.createShop({
      name: "Onboard Test",
      subscriptionMonths: 1,
      ownerLineId: "line-onboard-test",
      ownerName: "Owner",
    });
    const activation = await getShopActivation(shop);
    assert.equal(activation.claimed, true);
    assert.equal(activation.teamOk, false);
    assert.equal(activation.ready, false);
  });

  it("booking link contains correct slug", () => {
    const slug = "testshop";
    const web = buildShopWebUrl(slug);
    assert.ok(web.includes(`/${slug}`));
    const liff = buildShopLiffUrl(slug);
    if (liff) assert.ok(liff.endsWith(`/${slug}`));
  });
});

describe("setup authorization", () => {
  const ownerA: StaffAuth = {
    staffId: SAEB_ID,
    name: "Owner",
    role: "owner",
    barberId: SAEB_ID,
    shopId: PHINX_SHOP,
  };
  const barberB: StaffAuth = {
    staffId: "22222222-2222-4222-8222-222222222222",
    name: "Tide",
    role: "barber",
    barberId: "22222222-2222-4222-8222-222222222222",
    shopId: PHINX_SHOP,
  };

  it("barber cannot pass owner gate", () => {
    assert.throws(() => assertShopOwner(barberB), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("owner can manage barber in same shop", async () => {
    assert.equal(await canManageBarber(ownerA, barberB.barberId!), true);
  });

  it("shop mismatch blocks cross-shop management", async () => {
    const other = await memoryStore.createShop({ name: "Other", subscriptionMonths: 1 });
    const otherBarber = await memoryStore.createBarber({
      shopId: other.id,
      name: "X",
      slotDuration: 30,
    });
    assert.equal(await canManageBarber(ownerA, otherBarber.id), false);
  });
});
