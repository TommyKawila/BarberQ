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
