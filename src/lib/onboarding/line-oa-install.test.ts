import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertShopOwner, type StaffAuth } from "@/lib/admin-auth";
import { memoryStore } from "@/lib/data/memory-store";
import { dictionary } from "@/lib/i18n/dictionary";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import {
  canSubmitNewRequest,
  isOpenLineOaInstallStatus,
  normalizeLineOa,
  shouldShowSuccessState,
  validateLineOaInstallPayload,
} from "@/lib/onboarding/line-oa-install";
import { BookingError } from "@/lib/services/booking-service";

const barberStaff: StaffAuth = {
  staffId: "b1",
  name: "Barber",
  role: "barber",
  barberId: "b1",
  shopId: "shop-a",
};

describe("line-oa-install validation", () => {
  it("normalizes line OA with @ prefix", () => {
    assert.equal(normalizeLineOa("myshop"), "@myshop");
    assert.equal(normalizeLineOa("@myshop"), "@myshop");
  });

  it("rejects empty line OA", () => {
    assert.throws(
      () => validateLineOaInstallPayload({ lineOa: "", richMenuState: "none", helpType: "recommend", contactPhone: "080" }),
      /INVALID_LINE_OA/,
    );
  });

  it("rejects password-like fields", () => {
    assert.throws(
      () =>
        validateLineOaInstallPayload({
          lineOa: "@shop",
          richMenuState: "none",
          helpType: "recommend",
          contactPhone: "080",
          linePassword: "secret",
        }),
      /INVALID_CREDENTIAL_FIELD/,
    );
  });

  it("accepts valid payload", () => {
    const input = validateLineOaInstallPayload({
      lineOa: "tmybarber",
      richMenuState: "existing",
      helpType: "add_to_existing",
      contactPhone: "0812345678",
    });
    assert.equal(input.lineOa, "@tmybarber");
    assert.equal(input.richMenuState, "existing");
  });
});

describe("line-oa-install store", () => {
  it("scopes latest request to shop", async () => {
    const shopA = await memoryStore.createShop({
      name: "Line OA Shop A",
      ownerLineId: "U-line-oa-a",
      ownerName: "Owner A",
      subscriptionMonths: 1,
    });
    const shopB = await memoryStore.createShop({
      name: "Line OA Shop B",
      ownerLineId: "U-line-oa-b",
      ownerName: "Owner B",
      subscriptionMonths: 1,
    });

    await memoryStore.createLineOaInstallRequest(shopA.id, {
      lineOa: "@shop-a",
      richMenuState: "none",
      helpType: "new_menu",
      contactPhone: "0800000001",
    });

    const latestA = await memoryStore.getLatestLineOaInstallRequest(shopA.id);
    const latestB = await memoryStore.getLatestLineOaInstallRequest(shopB.id);
    assert.ok(latestA);
    assert.equal(latestB, null);
  });

  it("returns existing open request instead of duplicating", async () => {
    const shop = await memoryStore.createShop({
      name: "Dup Shop",
      ownerLineId: "U-line-oa-dup",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const first = await memoryStore.createLineOaInstallRequest(shop.id, {
      lineOa: "@dup",
      richMenuState: "unsure",
      helpType: "recommend",
      contactPhone: "0800000002",
    });
    const second = await memoryStore.createLineOaInstallRequest(shop.id, {
      lineOa: "@other",
      richMenuState: "none",
      helpType: "new_menu",
      contactPhone: "0800000003",
    });
    assert.equal(second.id, first.id);
    assert.equal(second.line_oa, "@dup");
  });

  it("allows new request after cancelled", async () => {
    const shop = await memoryStore.createShop({
      name: "Cancel Shop",
      ownerLineId: "U-line-oa-cancel",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const first = await memoryStore.createLineOaInstallRequest(shop.id, {
      lineOa: "@cancel",
      richMenuState: "none",
      helpType: "recommend",
      contactPhone: "0800000004",
    });
    await memoryStore.updateLineOaInstallRequestStatus(first.id, "CANCELLED");
    const second = await memoryStore.createLineOaInstallRequest(shop.id, {
      lineOa: "@new",
      richMenuState: "existing",
      helpType: "add_to_existing",
      contactPhone: "0800000005",
    });
    assert.notEqual(second.id, first.id);
    assert.equal(second.line_oa, "@new");
  });

  it("super admin can list all and update status", async () => {
    const shop = await memoryStore.createShop({
      name: "SA Shop",
      ownerLineId: "U-line-oa-sa",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const created = await memoryStore.createLineOaInstallRequest(shop.id, {
      lineOa: "@sa",
      richMenuState: "none",
      helpType: "recommend",
      contactPhone: "0800000006",
    });
    const all = await memoryStore.listLineOaInstallRequests();
    assert.ok(all.some((r) => r.id === created.id));
    const updated = await memoryStore.updateLineOaInstallRequestStatus(created.id, "DONE");
    assert.equal(updated.status, "DONE");
  });

  it("rejects invalid status update", async () => {
    await assert.rejects(
      () =>
        memoryStore.updateLineOaInstallRequestStatus(
          "00000000-0000-0000-0000-000000000099",
          "DONE",
        ),
      /NOT_FOUND/,
    );
  });
});

describe("line-oa-install auth", () => {
  it("rejects barber as owner", () => {
    assert.throws(() => assertShopOwner(barberStaff), (err: unknown) => {
      return err instanceof BookingError && err.code === "FORBIDDEN";
    });
  });

  it("rejects missing super admin token", () => {
    process.env.SUPERADMIN_TOKEN = "sa-token";
    assert.throws(() => assertSuperAdminToken(null), /Unauthorized/);
  });
});

describe("line-oa-install UX helpers", () => {
  it("tracks open and success states", () => {
    assert.equal(isOpenLineOaInstallStatus("NEW"), true);
    assert.equal(isOpenLineOaInstallStatus("DONE"), false);
    assert.equal(canSubmitNewRequest(null), true);
    assert.equal(shouldShowSuccessState({ status: "NEW" } as never), true);
    assert.equal(shouldShowSuccessState({ status: "CANCELLED" } as never), false);
  });
});

describe("line-oa-install copy", () => {
  it("has Thai help card copy", () => {
    assert.equal(dictionary.th["onboarding.oaHelpTitle"], "ติดตั้งไม่เป็น? ให้เราช่วยได้");
    assert.equal(dictionary.th["onboarding.oaHelpRequestCta"], "ให้ทีมช่วยติดตั้ง");
    assert.equal(dictionary.th["onboarding.oaHelpNoPassword"], "BarberQ จะไม่ขอรหัสผ่าน LINE ของคุณ");
    assert.equal(dictionary.th["onboarding.lineSupportSubmit"], "ส่งคำขอ");
  });
});
