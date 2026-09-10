import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertShopOwner, type StaffAuth } from "@/lib/admin-auth";
import { memoryStore } from "@/lib/data/memory-store";
import { bookingSummaryReady, canSubmitBooking } from "@/lib/booking/customer-flow";
import {
  CoverImageError,
  validateCoverImageBuffer,
} from "@/lib/image/validate-cover-image";
import { uploadShopCoverImage } from "@/lib/shop/cover-image-storage";
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

const ownerOtherShop: StaffAuth = {
  staffId: "owner-b",
  name: "Owner B",
  role: "owner",
  barberId: "owner-b",
  shopId: "shop-b",
};

const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);

const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("cover image validation", () => {
  it("rejects empty buffer", () => {
    assert.throws(
      () => validateCoverImageBuffer(new ArrayBuffer(0), "image/png"),
      (err: unknown) => err instanceof CoverImageError && err.code === "EMPTY",
    );
  });

  it("rejects oversized image", () => {
    const large = new ArrayBuffer(3 * 1024 * 1024 + 1);
    new Uint8Array(large).set(PNG_BYTES);
    assert.throws(
      () => validateCoverImageBuffer(large, "image/png"),
      (err: unknown) => err instanceof CoverImageError && err.code === "TOO_LARGE",
    );
  });

  it("rejects invalid MIME magic bytes", () => {
    const bad = new TextEncoder().encode("not-an-image").buffer;
    assert.throws(
      () => validateCoverImageBuffer(bad, "image/png"),
      (err: unknown) => err instanceof CoverImageError && err.code === "INVALID_TYPE",
    );
  });

  it("accepts PNG with matching MIME", () => {
    const type = validateCoverImageBuffer(PNG_BYTES.buffer, "image/png");
    assert.equal(type, "image/png");
  });

  it("accepts JPEG with matching MIME", () => {
    const type = validateCoverImageBuffer(JPEG_BYTES.buffer, "image/jpeg");
    assert.equal(type, "image/jpeg");
  });
});

describe("shop cover settings store", () => {
  it("defaults cover image to null", async () => {
    const settings = await memoryStore.getShopSettings(PHINX_SHOP);
    assert.equal(settings.coverImageUrl, null);
  });

  it("persists cover image URL", async () => {
    const current = await memoryStore.getShopSettings(PHINX_SHOP);
    const url = "https://cdn.example/shop-covers/cover.png";
    await memoryStore.setShopSettings(PHINX_SHOP, {
      ...current,
      coverImageUrl: url,
    });
    const updated = await memoryStore.getShopSettings(PHINX_SHOP);
    assert.equal(updated.coverImageUrl, url);
  });

  it("clears cover image URL on delete", async () => {
    const current = await memoryStore.getShopSettings(PHINX_SHOP);
    await memoryStore.setShopSettings(PHINX_SHOP, {
      ...current,
      coverImageUrl: "https://cdn.example/shop-covers/cover.png",
    });
    await memoryStore.setShopSettings(PHINX_SHOP, {
      ...current,
      coverImageUrl: null,
    });
    const updated = await memoryStore.getShopSettings(PHINX_SHOP);
    assert.equal(updated.coverImageUrl, null);
  });

  it("upload in prototype mode returns data URL", async () => {
    const url = await uploadShopCoverImage(PHINX_SHOP, PNG_BYTES.buffer, "image/png");
    assert.ok(url.startsWith("data:image/png;base64,"));
  });
});

describe("shop cover authorization", () => {
  it("barber cannot pass owner gate for cover management", () => {
    assert.throws(() => assertShopOwner(barberA), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("owner of same shop can pass owner gate", () => {
    assert.doesNotThrow(() => assertShopOwner(ownerA));
  });

  it("owner from another shop is a different tenant", () => {
    assert.notEqual(ownerA.shopId, ownerOtherShop.shopId);
    assert.doesNotThrow(() => assertShopOwner(ownerOtherShop));
  });
});

describe("booking behavior unchanged", () => {
  it("booking summary readiness unchanged", () => {
    assert.equal(
      bookingSummaryReady("b1", "2026-09-10", "2026-09-10T07:00:00.000Z"),
      true,
    );
  });

  it("duplicate submit protection unchanged", () => {
    assert.equal(canSubmitBooking(false), true);
    assert.equal(canSubmitBooking(true), false);
  });
});
