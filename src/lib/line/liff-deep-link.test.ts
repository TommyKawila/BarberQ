import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLiffStatePath,
  resolveBareShopPath,
  resolveLiffStateTarget,
  shopSlugFromPath,
} from "@/lib/line/liff-deep-link";

describe("liff deep-link path resolution", () => {
  it("detects shop slug from endpoint path", () => {
    assert.equal(shopSlugFromPath("/barberqpilottest"), "barberqpilottest");
    assert.equal(shopSlugFromPath("/barberqpilottest/bookings"), "barberqpilottest");
    assert.equal(shopSlugFromPath("/bookings"), null);
    assert.equal(shopSlugFromPath("/admin"), null);
    assert.equal(shopSlugFromPath("/"), null);
  });

  it("never treats legal/marketing routes as shop slugs (last-shop cookie)", () => {
    assert.equal(shopSlugFromPath("/terms"), null);
    assert.equal(shopSlugFromPath("/privacy"), null);
    assert.equal(shopSlugFromPath("/preview/hero-booking"), null);
    assert.equal(shopSlugFromPath("/qa/e2e"), null);
    assert.equal(
      resolveBareShopPath("/admin/staff", "terms", "phinxstudio"),
      "/phinxstudio/admin/staff",
    );
  });

  it("nests relative liff.state under current shop (QA rich-menu /bookings)", () => {
    assert.equal(
      resolveLiffStateTarget("/barberqpilottest", "bookings"),
      "/barberqpilottest/bookings",
    );
    assert.equal(
      resolveLiffStateTarget("/barberqpilottest", "/bookings"),
      "/barberqpilottest/bookings",
    );
    assert.equal(
      resolveLiffStateTarget("/barberqpilottest/", "admin"),
      "/barberqpilottest/admin",
    );
  });

  it("keeps global /c/{token} when LIFF endpoint already includes shop", () => {
    assert.equal(
      resolveLiffStateTarget(
        "/barberqpilottest",
        "/c/79599448a77d4ff28ca3c509d8f8fb5f",
      ),
      "/c/79599448a77d4ff28ca3c509d8f8fb5f",
    );
    assert.equal(
      resolveLiffStateTarget("/barberqpilottest", "c/tok"),
      "/c/tok",
    );
  });

  it("keeps already shop-scoped liff.state", () => {
    assert.equal(
      resolveLiffStateTarget("/barberqpilottest", "/barberqpilottest/bookings"),
      "/barberqpilottest/bookings",
    );
  });

  it("normalizes state without a shop context", () => {
    assert.equal(normalizeLiffStatePath("bookings"), "/bookings");
    assert.equal(resolveLiffStateTarget("/", "bookings"), "/bookings");
  });

  it("maps bare /bookings onto last shop or default (never sales /)", () => {
    assert.equal(
      resolveBareShopPath("/bookings", "barberqpilottest", "phinxstudio"),
      "/barberqpilottest/bookings",
    );
    assert.equal(
      resolveBareShopPath("/bookings", null, "phinxstudio"),
      "/phinxstudio/bookings",
    );
    assert.equal(
      resolveBareShopPath("/admin/settings", null, "phinxstudio"),
      "/phinxstudio/admin/settings",
    );
  });
});
