import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST as claimManager } from "@/app/api/manager/claim/route";
import { POST as createManagers, GET as listManagers } from "@/app/api/[shop]/managers/route";
import {
  assertShopOperator,
  assertShopOwner,
  assertStaffForShop,
  canManageBarber,
  getStaffFromLineId,
  type StaffAuth,
} from "@/lib/admin-auth";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { toPublicManagerInvite } from "@/lib/manager/invite-status";
import { isInviteOnlyQuery, resolveInviteCode } from "@/lib/manager/invite-session";
import { listBookableBarbers } from "@/lib/services/booking-service";
import { BookingError } from "@/lib/services/booking-service";

const INVITE = "9d921e956e864f26826e81f28d066365";
const OAUTH = "oauth-line-auth-code-abc";

let savedUrl: string | undefined;
let savedKey: string | undefined;
let savedLiff: string | undefined;

beforeEach(() => {
  savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  savedLiff = process.env.NEXT_PUBLIC_LIFF_ID;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_LIFF_ID;
});

afterEach(() => {
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  if (savedLiff === undefined) delete process.env.NEXT_PUBLIC_LIFF_ID;
  else process.env.NEXT_PUBLIC_LIFF_ID = savedLiff;
});

function lineReq(lineId: string, url = "http://localhost/api/manager/claim", body?: unknown) {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${lineId}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function shopWithOwner(name: string, ownerLineId: string) {
  return memoryStore.createShop({
    name,
    ownerLineId,
    ownerName: "Owner",
    subscriptionMonths: 1,
  });
}

describe("manager invite session", () => {
  it("valid invite initial load uses URL code", () => {
    assert.equal(isInviteOnlyQuery(`?code=${INVITE}`), true);
    assert.equal(resolveInviteCode(`?code=${INVITE}`, null), INVITE);
  });

  it("OAuth callback ignores URL code and uses stored invite", () => {
    const search = `?code=${OAUTH}&liffClientId=1234567890&state=foo`;
    assert.equal(isInviteOnlyQuery(search), false);
    assert.equal(resolveInviteCode(search, INVITE), INVITE);
    assert.notEqual(resolveInviteCode(search, INVITE), OAUTH);
  });
});

describe("manager invite and claim store", () => {
  it("invite once then claim creates membership without barber row", async () => {
    const shop = await shopWithOwner("Mgr Claim Shop", "U-owner-mgr-claim");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    const publicInvite = toPublicManagerInvite(invite);
    assert.equal("token" in publicInvite, false);
    const result = await memoryStore.claimManagerInvite({
      inviteToken: invite.token,
      lineId: "U-manager-once",
      displayName: "Manager One",
    });
    assert.equal(result.shopId, shop.id);
    const staff = await getStaffFromLineId("U-manager-once");
    assert.equal(staff?.role, "manager");
    assert.equal(staff?.barberId, null);
    assert.equal(staff?.shopId, shop.id);
    const barbers = await memoryStore.listBarbersByShop(shop.id);
    assert.equal(barbers.some((b) => b.id === result.managerId), false);
    const bookable = await listBookableBarbers(shop.id);
    assert.equal(bookable.some((b) => b.line_id === "U-manager-once"), false);
  });

  it("invalid invite rejected", async () => {
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: "not-a-real-manager-token",
          lineId: "U-invalid-mgr",
          displayName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_NOT_FOUND",
    );
  });

  it("expired invite rejected", async () => {
    const shop = await shopWithOwner("Mgr Expired", "U-owner-mgr-expired");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    const stored = (await memoryStore.listManagerInvites(shop.id)).find((i) => i.id === invite.id);
    assert.ok(stored);
    stored.expiresAt = new Date(Date.now() - 60_000).toISOString();
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: invite.token,
          lineId: "U-expired-mgr",
          displayName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_EXPIRED",
    );
  });

  it("consumed invite rejected", async () => {
    const shop = await shopWithOwner("Mgr Consumed", "U-owner-mgr-consumed");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    await memoryStore.claimManagerInvite({
      inviteToken: invite.token,
      lineId: "U-first-mgr",
      displayName: "First",
    });
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: invite.token,
          lineId: "U-second-mgr",
          displayName: "Second",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_ALREADY_CLAIMED",
    );
  });

  it("revoked invite rejected", async () => {
    const shop = await shopWithOwner("Mgr Revoked Invite", "U-owner-mgr-revoked-inv");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    await memoryStore.cancelManagerInvite(shop.id, invite.id);
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: invite.token,
          lineId: "U-revoked-invite-mgr",
          displayName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_REVOKED",
    );
  });

  it("regenerate invalidates old token", async () => {
    const shop = await shopWithOwner("Mgr Regen", "U-owner-mgr-regen");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    const oldToken = invite.token;
    const next = await memoryStore.regenerateManagerInvite(shop.id, invite.id);
    assert.notEqual(next.token, oldToken);
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: oldToken,
          lineId: "U-regen-mgr",
          displayName: "X",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_REVOKED",
    );
    const claimed = await memoryStore.claimManagerInvite({
      inviteToken: next.token,
      lineId: "U-regen-mgr",
      displayName: "Regen",
    });
    assert.equal(claimed.shopId, shop.id);
  });

  it("double claim same shop does not consume a fresh invite", async () => {
    const shop = await shopWithOwner("Mgr Double", "U-owner-mgr-double");
    const first = await memoryStore.createManagerInvite(shop.id, null);
    await memoryStore.claimManagerInvite({
      inviteToken: first.token,
      lineId: "U-double-mgr",
      displayName: "Double",
    });
    const second = await memoryStore.createManagerInvite(shop.id, null);
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: second.token,
          lineId: "U-double-mgr",
          displayName: "Double",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "MANAGER_ALREADY_ACTIVE",
    );
    const invites = await memoryStore.listManagerInvites(shop.id);
    const fresh = invites.find((i) => i.id === second.id);
    assert.equal(fresh?.consumedAt, null);
  });

  it("shop A invite cannot authorize shop B", async () => {
    const shopA = await shopWithOwner("Mgr Shop A", "U-owner-mgr-a");
    const shopB = await shopWithOwner("Mgr Shop B", "U-owner-mgr-b");
    const inviteA = await memoryStore.createManagerInvite(shopA.id, null);
    const claimed = await memoryStore.claimManagerInvite({
      inviteToken: inviteA.token,
      lineId: "U-mgr-shop-a",
      displayName: "A Manager",
    });
    assert.equal(claimed.shopId, shopA.id);
    assert.notEqual(claimed.shopId, shopB.id);
    const staff = await getStaffFromLineId("U-mgr-shop-a");
    assert.equal(staff?.shopId, shopA.id);
  });

  it("LINE already owner or barber is incompatible", async () => {
    const shop = await shopWithOwner("Mgr Incompat", "U-owner-mgr-incompat");
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Existing Barber",
      lineId: "U-existing-barber",
    });
    assert.ok(barber.line_id);
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: invite.token,
          lineId: "U-owner-mgr-incompat",
          displayName: "Owner As Manager",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "IDENTITY_INCOMPATIBLE",
    );
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: invite.token,
          lineId: "U-existing-barber",
          displayName: "Barber As Manager",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "IDENTITY_INCOMPATIBLE",
    );
  });

  it("active manager of another shop is incompatible", async () => {
    const shopA = await shopWithOwner("Mgr Cross A", "U-owner-cross-a");
    const shopB = await shopWithOwner("Mgr Cross B", "U-owner-cross-b");
    const inviteA = await memoryStore.createManagerInvite(shopA.id, null);
    await memoryStore.claimManagerInvite({
      inviteToken: inviteA.token,
      lineId: "U-mgr-one-shop",
      displayName: "One Shop",
    });
    const inviteB = await memoryStore.createManagerInvite(shopB.id, null);
    await assert.rejects(
      () =>
        memoryStore.claimManagerInvite({
          inviteToken: inviteB.token,
          lineId: "U-mgr-one-shop",
          displayName: "One Shop",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "IDENTITY_INCOMPATIBLE",
    );
  });

  it("owner claim remains unchanged", async () => {
    const shop = await memoryStore.createShop({
      name: "Owner Still Works",
      subscriptionMonths: 1,
    });
    assert.ok(shop.invite_token);
    const claimed = await memoryStore.claimOwnerInvite({
      inviteToken: shop.invite_token,
      ownerLineId: "U-owner-still",
      ownerName: "Still Owner",
    });
    assert.equal(claimed.status, "active");
    assert.equal(claimed.slug, shop.slug);
  });
});

describe("manager authorization", () => {
  it("assertShopOperator allows manager and owner, rejects barber", () => {
    const manager: StaffAuth = {
      staffId: "m1",
      name: "M",
      role: "manager",
      barberId: null,
      shopId: "shop-a",
    };
    const owner: StaffAuth = {
      staffId: "o1",
      name: "O",
      role: "owner",
      barberId: "o1",
      shopId: "shop-a",
    };
    const barber: StaffAuth = {
      staffId: "b1",
      name: "B",
      role: "barber",
      barberId: "b1",
      shopId: "shop-a",
    };
    assert.doesNotThrow(() => assertShopOperator(manager));
    assert.doesNotThrow(() => assertShopOperator(owner));
    assert.throws(() => assertShopOwner(manager), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
    assert.throws(() => assertShopOperator(barber), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("manager A denied shop B read/mutate", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const shopA = await shopWithOwner("Iso A", "U-owner-iso-a");
    const shopB = await shopWithOwner("Iso B", "U-owner-iso-b");
    const barberB = await memoryStore.createBarber({ shopId: shopB.id, name: "B Barber" });
    const invite = await memoryStore.createManagerInvite(shopA.id, null);
    await memoryStore.claimManagerInvite({
      inviteToken: invite.token,
      lineId: "U-mgr-iso-a",
      displayName: "Iso Manager",
    });
    await assert.rejects(
      () => assertStaffForShop(lineReq("U-mgr-iso-a"), shopB.id),
      (err: unknown) => err instanceof BookingError && err.code === "FORBIDDEN",
    );
    const staff = await getStaffFromLineId("U-mgr-iso-a");
    assert.ok(staff);
    assert.equal(await canManageBarber(staff, barberB.id), false);
  });

  it("manager cannot invite or revoke managers", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const shop = await shopWithOwner("No Invite", "U-owner-no-invite");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    await memoryStore.claimManagerInvite({
      inviteToken: invite.token,
      lineId: "U-mgr-cannot-invite",
      displayName: "Cannot Invite",
    });
    const res = await createManagers(lineReq("U-mgr-cannot-invite", "http://localhost", {}), {
      params: Promise.resolve({ shop: shop.slug }),
    });
    assert.equal(res.status, 403);
    const list = await listManagers(lineReq("U-mgr-cannot-invite"), {
      params: Promise.resolve({ shop: shop.slug }),
    });
    assert.equal(list.status, 403);
  });

  it("manager cannot deactivate owner", async () => {
    const shop = await shopWithOwner("Keep Owner", "U-owner-keep");
    const owners = await memoryStore.listBarbersByShop(shop.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner);
    await assert.rejects(
      () => memoryStore.deactivateBarber(shop.id, owner.id),
      (err: unknown) => err instanceof StoreConflict && err.code === "NOT_OWNER",
    );
  });

  it("revoke then reauth denied", async () => {
    const shop = await shopWithOwner("Revoke Reauth", "U-owner-revoke-reauth");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    const claimed = await memoryStore.claimManagerInvite({
      inviteToken: invite.token,
      lineId: "U-mgr-revoke-reauth",
      displayName: "Revoked Later",
    });
    await memoryStore.revokeShopManager(shop.id, claimed.managerId);
    assert.equal(await memoryStore.getActiveManagerByLineId("U-mgr-revoke-reauth"), null);
    assert.equal(await getStaffFromLineId("U-mgr-revoke-reauth"), null);
  });

  it("verified LINE required and fake client line_id ignored", async () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    const shop = await shopWithOwner("Verified Line", "U-owner-verified-mgr");
    const invite = await memoryStore.createManagerInvite(shop.id, null);
    await assert.rejects(() => assertVerifiedCustomer(new Request("http://localhost")));
    const res = await claimManager(
      lineReq("U-verified-mgr", "http://localhost/api/manager/claim", {
        code: invite.token,
        lineId: "U-forged-line",
        shopId: "forged-shop",
        displayName: "Verified",
      }),
    );
    assert.equal(res.status, 200);
    assert.ok(await memoryStore.getActiveManagerByLineId("U-verified-mgr"));
    assert.equal(await memoryStore.getActiveManagerByLineId("U-forged-line"), null);
  });
});
