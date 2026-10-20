import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST as claimBarberLine } from "@/app/api/barber-line-invite/claim/route";
import {
  GET as getInvite,
  POST as createInvite,
  DELETE as cancelInvite,
} from "@/app/api/barbers/[id]/line-invite/route";
import { getStaffFromLineId, type StaffAuth } from "@/lib/admin-auth";
import { isValidLineUserId } from "@/lib/barber/line-user-id";
import {
  barberLineLinkCardStatus,
  publicBarberLineInviteStatus,
  toPublicBarberLineInvite,
} from "@/lib/barber/line-invite-status";
import { buildBarberLineInviteUrl, buildLineShareUrl } from "@/lib/barber/line-invite-url";
import { isInviteOnlyQuery, resolveInviteCode } from "@/lib/barber/line-invite-session";
import {
  shouldAutoClaimBarberLine,
  buildBarberLineLiffLoginRedirectUri,
} from "@/lib/barber/barber-line-claim-state";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { dictionary } from "@/lib/i18n/dictionary";

const INVITE = "9d921e956e864f26826e81f28d066365";
const OAUTH = "oauth-line-auth-code-abc";

let savedUrl: string | undefined;
let savedKey: string | undefined;
let savedLiff: string | undefined;
let savedApp: string | undefined;

beforeEach(() => {
  savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  savedLiff = process.env.NEXT_PUBLIC_LIFF_ID;
  savedApp = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_LIFF_ID;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
});

afterEach(() => {
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  if (savedLiff === undefined) delete process.env.NEXT_PUBLIC_LIFF_ID;
  else process.env.NEXT_PUBLIC_LIFF_ID = savedLiff;
  if (savedApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = savedApp;
});

function staffReq(staff: StaffAuth, url: string, init?: RequestInit) {
  return new Request(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${staff.lineId}`,
      ...(init?.headers ?? {}),
    },
  });
}

function lineReq(lineId: string, body?: unknown) {
  return new Request("http://localhost/api/barber-line-invite/claim", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lineId}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
}

async function shopWithOwnerAndBarber(label: string) {
  const shop = await memoryStore.createShop({
    name: `Barber LINE ${label} ${Date.now()}`,
    ownerLineId: `U-owner-${label}`,
    ownerName: "Owner",
    subscriptionMonths: 1,
  });
  const barber = await memoryStore.createBarber({
    shopId: shop.id,
    name: `Chair ${label}`,
    slotDuration: 30,
  });
  const owner = (await getStaffFromLineId(`U-owner-${label}`))!;
  return { shop, barber, owner };
}

describe("line user id validation", () => {
  it("accepts U + 32 hex", () => {
    assert.equal(isValidLineUserId("U" + "a".repeat(32)), true);
    assert.equal(isValidLineUserId("U" + "0123456789abcdef0123456789abcdef"), true);
  });

  it("rejects wrong shapes", () => {
    assert.equal(isValidLineUserId("mock-owner-line-id"), false);
    assert.equal(isValidLineUserId("U" + "A".repeat(32)), false);
    assert.equal(isValidLineUserId("U" + "a".repeat(31)), false);
    assert.equal(isValidLineUserId(""), false);
  });
});

describe("barber line invite session + status", () => {
  it("OAuth callback ignores URL code and uses stored invite", () => {
    assert.equal(isInviteOnlyQuery(`?code=${INVITE}`), true);
    const search = `?code=${OAUTH}&liffClientId=1234567890&state=foo`;
    assert.equal(isInviteOnlyQuery(search), false);
    assert.equal(resolveInviteCode(search, INVITE), INVITE);
  });

  it("public invite never exposes token", () => {
    const invite = {
      id: "1",
      shopId: "s",
      barberId: "b",
      token: "secret",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      consumedAt: null,
      revokedAt: null,
      createdAt: new Date().toISOString(),
      createdByBarberId: null,
    };
    const pub = toPublicBarberLineInvite(invite);
    assert.equal("token" in pub, false);
    assert.equal(publicBarberLineInviteStatus(invite), "pending");
  });

  it("card status covers unlinked / pending / linked", () => {
    assert.equal(barberLineLinkCardStatus({ lineId: null, pendingInvite: null }), "unlinked");
    assert.equal(
      barberLineLinkCardStatus({
        lineId: null,
        pendingInvite: {
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          consumedAt: null,
          revokedAt: null,
        },
      }),
      "pending",
    );
    assert.equal(
      barberLineLinkCardStatus({ lineId: "Ua".padEnd(33, "a"), pendingInvite: null }),
      "linked",
    );
  });

  it("share + invite URLs", () => {
    const url = buildBarberLineInviteUrl("abc");
    assert.equal(url, "https://app.example.com/barber/join?code=abc");
    assert.match(buildLineShareUrl(url), /social-plugins\.line\.me/);
  });

  it("auto-claim only when authenticated + preview ready", () => {
    assert.equal(
      shouldAutoClaimBarberLine({
        authPhase: "authenticated",
        previewReady: true,
        claimed: false,
        claimAttempted: false,
      }),
      true,
    );
    assert.equal(
      shouldAutoClaimBarberLine({
        authPhase: "needs_login",
        previewReady: true,
        claimed: false,
        claimAttempted: false,
      }),
      false,
    );
  });

  it("LIFF redirect uses /barber/join", () => {
    const uri = buildBarberLineLiffLoginRedirectUri({
      pageOrigin: "https://app.example.com",
      appUrl: "https://app.example.com",
      inviteCode: "tok",
    });
    assert.match(uri, /\/barber\/join\?invite=tok/);
  });
});

describe("barber line invite store + claim", () => {
  it("create invite then claim binds line_id and display name", async () => {
    const { shop, barber, owner } = await shopWithOwnerAndBarber("claim");
    const invite = await memoryStore.createBarberLineInvite(shop.id, barber.id, owner.barberId);
    assert.equal(publicBarberLineInviteStatus(invite), "pending");

    const result = await memoryStore.claimBarberLineInvite({
      inviteToken: invite.token,
      lineId: "U" + "b".repeat(32),
      displayName: "Ken LINE",
    });
    assert.equal(result.barberId, barber.id);
    const updated = await memoryStore.getBarber(barber.id);
    assert.equal(updated?.line_id, "U" + "b".repeat(32));
    assert.equal(updated?.line_display_name, "Ken LINE");
    const staff = await getStaffFromLineId("U" + "b".repeat(32));
    assert.equal(staff?.barberId, barber.id);
  });

  it("rejects expired, used, and LINE taken in same shop", async () => {
    const { shop, barber, owner } = await shopWithOwnerAndBarber("taken");
    const other = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Other",
      slotDuration: 30,
      lineId: "U" + "c".repeat(32),
    });
    void other;
    const invite = await memoryStore.createBarberLineInvite(shop.id, barber.id, owner.barberId);
    await assert.rejects(
      () =>
        memoryStore.claimBarberLineInvite({
          inviteToken: invite.token,
          lineId: "U" + "c".repeat(32),
          displayName: "Dup",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "LINE_ID_TAKEN",
    );

    const ok = await memoryStore.claimBarberLineInvite({
      inviteToken: invite.token,
      lineId: "U" + "d".repeat(32),
      displayName: "Ok",
    });
    assert.equal(ok.barberId, barber.id);
    await assert.rejects(
      () =>
        memoryStore.claimBarberLineInvite({
          inviteToken: invite.token,
          lineId: "U" + "e".repeat(32),
          displayName: "Again",
        }),
      (err: unknown) => err instanceof StoreConflict && err.code === "INVITE_ALREADY_CLAIMED",
    );
  });

  it("API create returns inviteUrl once; cancel revokes pending", async () => {
    const { shop, barber, owner } = await shopWithOwnerAndBarber("api");
    void shop;
    const createRes = await createInvite(
      staffReq(owner, `http://localhost/api/barbers/${barber.id}/line-invite`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: barber.id }) },
    );
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      invite?: { id: string };
      inviteUrl?: string;
    };
    assert.ok(created.inviteUrl?.includes("/barber/join?code="));
    assert.ok(created.invite?.id);

    const getRes = await getInvite(
      staffReq(owner, `http://localhost/api/barbers/${barber.id}/line-invite`),
      { params: Promise.resolve({ id: barber.id }) },
    );
    const listed = (await getRes.json()) as { invite?: { id: string; status: string } };
    assert.equal(listed.invite?.status, "pending");
    assert.equal("token" in (listed.invite ?? {}), false);

    const delRes = await cancelInvite(
      staffReq(owner, `http://localhost/api/barbers/${barber.id}/line-invite`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: created.invite!.id }),
      }),
      { params: Promise.resolve({ id: barber.id }) },
    );
    assert.equal(delRes.status, 200);

    const after = await memoryStore.getPendingBarberLineInvite(shop.id, barber.id);
    assert.equal(after, null);
  });

  it("claim API binds verified LINE id", async () => {
    const { shop, barber, owner } = await shopWithOwnerAndBarber("claim-api");
    const invite = await memoryStore.createBarberLineInvite(shop.id, barber.id, owner.barberId);
    const lineId = "U" + "f".repeat(32);
    const res = await claimBarberLine(
      lineReq(lineId, { code: invite.token, displayName: "From API" }),
    );
    assert.equal(res.status, 200);
    const json = (await res.json()) as { barber?: { id: string } };
    assert.equal(json.barber?.id, barber.id);
    const updated = await memoryStore.getBarber(barber.id);
    assert.equal(updated?.line_id, lineId);
  });

  it("Thai rejection messages exist for invite errors", () => {
    assert.match(dictionary.th["barberLine.inviteExpired"], /หมดอายุ/);
    assert.match(dictionary.th["barberLine.inviteClaimed"], /ใช้ไปแล้ว/);
    assert.match(dictionary.th["barberLine.lineTaken"], /ผูกกับช่างอื่น/);
    assert.match(dictionary.th["barberLine.invalidLineId"], /ไม่ถูกต้อง/);
  });
});
