import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import {
  isInviteOnlyQuery,
  resolveInviteCode,
} from "@/lib/owner/invite-session";

const INVITE = "9d921e956e864f26826e81f28d066365";
const OAUTH = "oauth-line-auth-code-abc";

describe("owner invite session", () => {
  it("valid invite initial load uses URL code", () => {
    assert.equal(isInviteOnlyQuery(`?code=${INVITE}`), true);
    assert.equal(
      resolveInviteCode(`?code=${INVITE}`, null),
      INVITE,
    );
  });

  it("OAuth callback ignores URL code and uses stored invite", () => {
    const search = `?code=${OAUTH}&liffClientId=1234567890&state=foo`;
    assert.equal(isInviteOnlyQuery(search), false);
    assert.equal(resolveInviteCode(search, INVITE), INVITE);
    assert.notEqual(resolveInviteCode(search, INVITE), OAUTH);
  });

  it("empty stored invite on OAuth callback resolves null", () => {
    const search = `?code=${OAUTH}&liffClientId=1234567890`;
    assert.equal(resolveInviteCode(search, null), null);
    assert.equal(resolveInviteCode(search, ""), null);
  });

  it("falls back to stored invite when URL has no code", () => {
    assert.equal(resolveInviteCode("", INVITE), INVITE);
    assert.equal(resolveInviteCode("?", INVITE), INVITE);
  });

  it("OAuth callback uses invite query when storage is empty", () => {
    const search = `?invite=${INVITE}&code=${OAUTH}&liffClientId=1234567890`;
    assert.equal(resolveInviteCode(search, null), INVITE);
    assert.notEqual(resolveInviteCode(search, null), OAUTH);
  });
});

describe("owner claim store", () => {
  it("valid invite preview loads shop name", async () => {
    const shop = await memoryStore.createShop({
      name: "BarberQ Pilot Test",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const preview = await memoryStore.getShopInvitePreview(shop.invite_token);
    assert.equal(preview?.shopName, "BarberQ Pilot Test");
    assert.equal(preview?.claimed, false);
    assert.equal(preview?.expired, false);
  });

  it("claim uses verified line id and returns correct slug not phinx", async () => {
    const shop = await memoryStore.createShop({
      name: "Pilot Claim Shop",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const claimed = await memoryStore.claimOwnerInvite({
      inviteToken: shop.invite_token,
      ownerLineId: "U-pilot-owner-claim",
      ownerName: "Pilot Owner",
    });
    assert.equal(claimed.slug, shop.slug);
    assert.notEqual(claimed.slug, "phinxstudio");
    assert.equal(claimed.status, "active");
  });

  it("invalid invite rejected", async () => {
    const preview = await memoryStore.getShopInvitePreview("not-a-real-token");
    assert.equal(preview, null);
    await assert.rejects(
      () =>
        memoryStore.claimOwnerInvite({
          inviteToken: "not-a-real-token",
          ownerLineId: "U-invalid",
          ownerName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_NOT_FOUND",
    );
  });

  it("expired invite rejected", async () => {
    const shop = await memoryStore.createShop({
      name: "Expired Pilot",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const token = shop.invite_token;
    const shops = await memoryStore.listShops();
    const target = shops.find((s) => s.id === shop.id);
    assert.ok(target);
    target.invite_expires_at = new Date(Date.now() - 60_000).toISOString();

    const preview = await memoryStore.getShopInvitePreview(token);
    assert.equal(preview?.expired, true);

    await assert.rejects(
      () =>
        memoryStore.claimOwnerInvite({
          inviteToken: token,
          ownerLineId: "U-expired",
          ownerName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_EXPIRED",
    );
  });

  it("already claimed invite rejected", async () => {
    const shop = await memoryStore.createShop({
      name: "Already Claimed",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const token = shop.invite_token;
    await memoryStore.claimOwnerInvite({
      inviteToken: token,
      ownerLineId: "U-first-owner",
      ownerName: "First",
    });
    const preview = await memoryStore.getShopInvitePreview(token);
    assert.equal(preview, null);
    await assert.rejects(
      () =>
        memoryStore.claimOwnerInvite({
          inviteToken: token,
          ownerLineId: "U-second-owner",
          ownerName: "Second",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_NOT_FOUND",
    );
  });
});

describe("owner claim auth", () => {
  const originalLiffId = process.env.NEXT_PUBLIC_LIFF_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LIFF_ID = originalLiffId;
  });

  it("claim uses verified Bearer token", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer mock-owner-line-id" },
    });
    const user = await assertVerifiedCustomer(req);
    assert.equal(user.userId, "mock-owner-line-id");
  });

  it("missing Bearer rejected for claim", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    await assert.rejects(() => assertVerifiedCustomer(new Request("http://localhost")));
  });
});
