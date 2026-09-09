import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StoreConflict } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

const OWNER_LINE = "U-unlink-owner-test";
const BARBER_LINE = "U-unlink-barber-test";

describe("unlinkBarberLine", () => {
  it("unlinks barber in own shop and keeps row", async () => {
    const shop = await memoryStore.createShop({
      name: "Unlink Barber Shop",
      ownerLineId: OWNER_LINE,
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Staff A",
      lineId: BARBER_LINE,
    });
    assert.equal(barber.line_id, BARBER_LINE);

    const updated = await memoryStore.unlinkBarberLine(shop.id, barber.id);
    assert.equal(updated.line_id, null);
    assert.equal(updated.id, barber.id);
    assert.equal(updated.name, "Staff A");

    const reloaded = await memoryStore.getBarber(barber.id);
    assert.ok(reloaded);
    assert.equal(reloaded.line_id, null);
  });

  it("keeps appointments untouched after unlink", async () => {
    const shop = await memoryStore.createShop({
      name: "Appt Unlink Shop",
      ownerLineId: "U-unlink-appt-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Bookable",
      lineId: "U-unlink-appt-barber",
    });
    const start = new Date("2026-12-01T10:00:00.000Z");
    const end = new Date("2026-12-01T11:00:00.000Z");
    const apt = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: "cust-1",
      customerName: "Customer",
      customerPhone: "0800000000",
      startTime: start,
      endTime: end,
    });

    await memoryStore.unlinkBarberLine(shop.id, barber.id);
    const reloaded = await memoryStore.getAppointment(apt.id);
    assert.ok(reloaded);
    assert.equal(reloaded.barber_id, barber.id);
    assert.equal(reloaded.status, "confirmed");
  });

  it("rejects shop/barber mismatch", async () => {
    const shopA = await memoryStore.createShop({
      name: "Shop A",
      ownerLineId: "U-unlink-mismatch-a",
      ownerName: "Owner A",
      subscriptionMonths: 1,
    });
    const shopB = await memoryStore.createShop({
      name: "Shop B",
      ownerLineId: "U-unlink-mismatch-b",
      ownerName: "Owner B",
      subscriptionMonths: 1,
    });
    const barbersA = await memoryStore.listBarbersByShop(shopA.id);
    const ownerA = barbersA.find((b) => b.role === "owner");
    assert.ok(ownerA?.line_id);

    await assert.rejects(
      () => memoryStore.unlinkBarberLine(shopB.id, ownerA.id),
      (err: unknown) => err instanceof StoreConflict && err.code === "BARBER_NOT_FOUND",
    );

    const stillLinked = await memoryStore.getBarber(ownerA.id);
    assert.equal(stillLinked?.line_id, ownerA.line_id);
  });

  it("is idempotent when line_id already null", async () => {
    const shop = await memoryStore.createShop({
      name: "Idempotent Shop",
      ownerLineId: "U-unlink-idempotent-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: "No Line",
    });
    assert.equal(barber.line_id, null);

    const first = await memoryStore.unlinkBarberLine(shop.id, barber.id);
    const second = await memoryStore.unlinkBarberLine(shop.id, barber.id);
    assert.equal(first.line_id, null);
    assert.equal(second.line_id, null);
    assert.equal(second.id, barber.id);
  });

  it("unlinks owner without changing shop status or invite", async () => {
    const ownerLine = "U-unlink-owner-status-test";
    const shop = await memoryStore.createShop({
      name: "Owner Unlink Shop",
      ownerLineId: ownerLine,
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const owners = await memoryStore.listBarbersByShop(shop.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner?.line_id);

    const beforeStatus = shop.status;
    const beforeInvite = shop.invite_token;

    await memoryStore.unlinkBarberLine(shop.id, owner.id);

    const afterShop = (await memoryStore.listShops()).find((s) => s.id === shop.id);
    assert.ok(afterShop);
    assert.equal(afterShop.status, beforeStatus);
    assert.equal(afterShop.invite_token, beforeInvite);

    const afterOwner = await memoryStore.getBarber(owner.id);
    assert.equal(afterOwner?.role, "owner");
    assert.equal(afterOwner?.line_id, null);
    assert.equal(await memoryStore.getBarberByLineId(ownerLine), null);
  });

  it("frees LINE id for claim on another pending shop", async () => {
    const claimed = await memoryStore.createShop({
      name: "Claimed Shop",
      ownerLineId: "U-unlink-reclaim-line",
      ownerName: "Old Owner",
      subscriptionMonths: 1,
    });
    const owners = await memoryStore.listBarbersByShop(claimed.id);
    const owner = owners.find((b) => b.role === "owner");
    assert.ok(owner);

    await memoryStore.unlinkBarberLine(claimed.id, owner.id);

    const pending = await memoryStore.createShop({
      name: "New Pending Shop",
      subscriptionMonths: 1,
    });
    assert.ok(pending.invite_token);

    const newShop = await memoryStore.claimOwnerInvite({
      inviteToken: pending.invite_token!,
      ownerLineId: "U-unlink-reclaim-line",
      ownerName: "New Owner",
    });
    assert.equal(newShop.status, "active");
    assert.equal(newShop.slug, pending.slug);
  });

  it("rejects unknown shop", async () => {
    await assert.rejects(
      () =>
        memoryStore.unlinkBarberLine(
          "00000000-0000-0000-0000-000000009999",
          "00000000-0000-0000-0000-000000000001",
        ),
      (err: unknown) => err instanceof StoreConflict && err.code === "NOT_FOUND",
    );
  });
});

describe("unlink line authorization", () => {
  it("rejects unauthorized super admin token", () => {
    process.env.SUPERADMIN_TOKEN = "correct-token";
    assert.throws(() => assertSuperAdminToken("wrong-token"), /Unauthorized/);
  });
});
