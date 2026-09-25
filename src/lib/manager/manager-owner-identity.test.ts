import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELETE as deleteProfileImage,
  POST as uploadProfileImage,
} from "@/app/api/barbers/[id]/profile-image/route";
import { PATCH as patchBarber } from "@/app/api/barbers/[id]/route";
import { getStaffFromLineId } from "@/lib/admin-auth";
import { memoryStore } from "@/lib/data/memory-store";

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);

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

function jsonReq(lineId: string, url: string, body: unknown) {
  return new Request(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${lineId}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function imageReq(lineId: string, url: string, method: "POST" | "DELETE") {
  if (method === "DELETE") {
    return new Request(url, {
      method,
      headers: { Authorization: `Bearer ${lineId}` },
    });
  }
  const form = new FormData();
  form.append("file", new File([PNG], "p.png", { type: "image/png" }));
  return new Request(url, {
    method,
    headers: { Authorization: `Bearer ${lineId}` },
    body: form,
  });
}

let n = 0;

async function shopWithManager() {
  n += 1;
  const shop = await memoryStore.createShop({
    name: `Owner Identity Shop ${n}`,
    ownerLineId: `U-owner-identity-${n}`,
    ownerName: "Shop Owner",
    subscriptionMonths: 1,
  });
  const invite = await memoryStore.createManagerInvite(shop.id, null);
  await memoryStore.claimManagerInvite({
    inviteToken: invite.token,
    lineId: `U-mgr-identity-${n}`,
    displayName: "Shop Manager",
  });
  const owners = await memoryStore.listBarbersByShop(shop.id);
  const owner = owners.find((b) => b.role === "owner");
  assert.ok(owner);
  const barber = await memoryStore.createBarber({
    shopId: shop.id,
    name: "Ordinary Barber",
    lineId: `U-ordinary-barber-${n}`,
  });
  return {
    shop,
    owner,
    barber,
    ownerLineId: `U-owner-identity-${n}`,
    managerLineId: `U-mgr-identity-${n}`,
  };
}

describe("QA-003-01 owner identity protection", () => {
  it("manager cannot change owner name", async () => {
    const { owner, managerLineId } = await shopWithManager();
    const before = owner.name;
    const res = await patchBarber(jsonReq(managerLineId, `http://localhost/api/barbers/${owner.id}`, {
      name: "Hijacked Owner",
    }), { params: Promise.resolve({ id: owner.id }) });
    assert.equal(res.status, 403);
    const json = (await res.json()) as { error?: { code?: string } };
    assert.equal(json.error?.code, "FORBIDDEN");
    const still = await memoryStore.getBarber(owner.id);
    assert.equal(still?.name, before);
  });

  it("manager cannot upload owner profile image", async () => {
    const { owner, managerLineId } = await shopWithManager();
    const res = await uploadProfileImage(
      imageReq(managerLineId, `http://localhost/api/barbers/${owner.id}/profile-image`, "POST"),
      { params: Promise.resolve({ id: owner.id }) },
    );
    assert.equal(res.status, 403);
    const still = await memoryStore.getBarber(owner.id);
    assert.equal(still?.profile_image_url ?? null, null);
  });

  it("manager cannot delete owner profile image", async () => {
    const { owner, managerLineId } = await shopWithManager();
    await memoryStore.updateBarber(owner.id, {
      profileImageUrl: "data:image/png;base64,xxx",
    });
    const res = await deleteProfileImage(
      imageReq(managerLineId, `http://localhost/api/barbers/${owner.id}/profile-image`, "DELETE"),
      { params: Promise.resolve({ id: owner.id }) },
    );
    assert.equal(res.status, 403);
    const still = await memoryStore.getBarber(owner.id);
    assert.equal(still?.profile_image_url, "data:image/png;base64,xxx");
  });

  it("manager can change ordinary barber name", async () => {
    const { barber, managerLineId } = await shopWithManager();
    const res = await patchBarber(jsonReq(managerLineId, `http://localhost/api/barbers/${barber.id}`, {
      name: "Renamed Barber",
    }), { params: Promise.resolve({ id: barber.id }) });
    assert.equal(res.status, 200);
    const json = (await res.json()) as { barber?: { name?: string } };
    assert.equal(json.barber?.name, "Renamed Barber");
  });

  it("manager can manage ordinary barber profile image", async () => {
    const { barber, managerLineId } = await shopWithManager();
    const upload = await uploadProfileImage(
      imageReq(managerLineId, `http://localhost/api/barbers/${barber.id}/profile-image`, "POST"),
      { params: Promise.resolve({ id: barber.id }) },
    );
    assert.equal(upload.status, 200);
    const uploaded = await memoryStore.getBarber(barber.id);
    assert.ok(uploaded?.profile_image_url);
    const del = await deleteProfileImage(
      imageReq(managerLineId, `http://localhost/api/barbers/${barber.id}/profile-image`, "DELETE"),
      { params: Promise.resolve({ id: barber.id }) },
    );
    assert.equal(del.status, 200);
    const after = await memoryStore.getBarber(barber.id);
    assert.equal(after?.profile_image_url ?? null, null);
  });

  it("manager still cannot change owner lineId", async () => {
    const { owner, managerLineId } = await shopWithManager();
    const before = owner.line_id;
    const res = await patchBarber(jsonReq(managerLineId, `http://localhost/api/barbers/${owner.id}`, {
      lineId: null,
    }), { params: Promise.resolve({ id: owner.id }) });
    assert.equal(res.status, 403);
    const still = await memoryStore.getBarber(owner.id);
    assert.equal(still?.line_id, before);
  });

  it("owner can still change own name and profile image", async () => {
    const { owner, ownerLineId } = await shopWithManager();
    const nameRes = await patchBarber(jsonReq(ownerLineId, `http://localhost/api/barbers/${owner.id}`, {
      name: "Owner Renamed",
    }), { params: Promise.resolve({ id: owner.id }) });
    assert.equal(nameRes.status, 200);
    const named = (await nameRes.json()) as { barber?: { name?: string } };
    assert.equal(named.barber?.name, "Owner Renamed");
    const upload = await uploadProfileImage(
      imageReq(ownerLineId, `http://localhost/api/barbers/${owner.id}/profile-image`, "POST"),
      { params: Promise.resolve({ id: owner.id }) },
    );
    assert.equal(upload.status, 200);
    const staff = await getStaffFromLineId(ownerLineId);
    assert.equal(staff?.role, "owner");
  });
});
