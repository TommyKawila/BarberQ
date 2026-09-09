import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

describe("regenerateOwnerInvite", () => {
  it("regenerates pending shop with new token and expiry", async () => {
    const shop = await memoryStore.createShop({
      name: "Regen Test Shop",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const oldToken = shop.invite_token;

    const updated = await memoryStore.regenerateOwnerInvite(shop.id);
    assert.notEqual(updated.invite_token, oldToken);
    assert.equal(updated.slug, shop.slug);
    assert.equal(updated.id, shop.id);
    assert.equal(updated.status, "pending");
    assert.ok(updated.invite_expires_at);

    const oldPreview = await memoryStore.getShopInvitePreview(oldToken);
    assert.equal(oldPreview, null);

    const newPreview = await memoryStore.getShopInvitePreview(updated.invite_token!);
    assert.equal(newPreview?.shopName, "Regen Test Shop");
    assert.equal(newPreview?.claimed, false);
    assert.equal(newPreview?.expired, false);
  });

  it("rejects regenerate for claimed shop", async () => {
    const shop = await memoryStore.createShop({
      name: "Claimed Regen Shop",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    await memoryStore.claimOwnerInvite({
      inviteToken: shop.invite_token,
      ownerLineId: "U-regen-claimed",
      ownerName: "Owner",
    });

    await assert.rejects(
      () => memoryStore.regenerateOwnerInvite(shop.id),
      (err: unknown) =>
        err instanceof StoreConflict && err.code === "INVITE_ALREADY_CLAIMED",
    );
  });

  it("rejects unknown shop", async () => {
    await assert.rejects(
      () => memoryStore.regenerateOwnerInvite("00000000-0000-0000-0000-000000009999"),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_NOT_FOUND",
    );
  });

  it("keeps slug unchanged after regenerate", async () => {
    const shop = await memoryStore.createShop({
      name: "Slug Stable Shop",
      subscriptionMonths: 1,
    });
    const before = shop.slug;
    const after = await memoryStore.regenerateOwnerInvite(shop.id);
    assert.equal(after.slug, before);
    assert.notEqual(after.slug, "phinxstudio");
  });
});

describe("regenerate invite authorization", () => {
  it("rejects unauthorized super admin token", () => {
    process.env.SUPERADMIN_TOKEN = "correct-token";
    assert.throws(() => assertSuperAdminToken("wrong-token"), /Unauthorized/);
  });
});
