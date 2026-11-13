import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_NO_SHOP_ACCESS_TH,
  isAdminNotAuthorizedError,
  isExpiredLiffTokenError,
  LIFF_INIT_FAIL_GUARD_TH,
  thaiLiffAuthError,
} from "@/lib/line/liff-auth-errors";

describe("liff auth errors (Thai + expiry)", () => {
  it("detects access token expired SDK messages", () => {
    assert.equal(isExpiredLiffTokenError(new Error("The access token expired")), true);
    assert.equal(isExpiredLiffTokenError(new Error("token expired")), true);
    assert.equal(isExpiredLiffTokenError(new Error("network error")), false);
  });

  it("maps expired token to Thai — never raw English", () => {
    const th = thaiLiffAuthError(new Error("The access token expired"));
    assert.match(th, /หมดอายุ|ล็อกอิน/);
    assert.doesNotMatch(th, /access token expired/i);
  });

  it("maps other English SDK errors to Thai fallback", () => {
    const th = thaiLiffAuthError(new Error("LIFF init failed"));
    assert.match(th, /LINE/);
    assert.doesNotMatch(th, /LIFF init failed/);
  });

  it("keeps Thai messages as-is even when they start with Latin letters", () => {
    assert.equal(thaiLiffAuthError("โหลดไม่สำเร็จ"), "โหลดไม่สำเร็จ");
    const mixed = "LINE ของคุณยังไม่ได้ผูกกับร้านนี้";
    assert.equal(thaiLiffAuthError(mixed), mixed);
  });

  it("maps Not authorized to clear shop-admin Thai copy", () => {
    assert.equal(isAdminNotAuthorizedError(new Error("Not authorized")), true);
    assert.equal(
      thaiLiffAuthError(new Error("Not authorized")),
      ADMIN_NO_SHOP_ACCESS_TH,
    );
    assert.match(ADMIN_NO_SHOP_ACCESS_TH, /ไม่มีสิทธิ์|หลังบ้าน/);
    assert.doesNotMatch(thaiLiffAuthError(new Error("Not authorized")), /Not authorized/i);
  });

  it("preserves ADMIN_NO_SHOP_ACCESS_TH when already Thai", () => {
    assert.equal(thaiLiffAuthError(ADMIN_NO_SHOP_ACCESS_TH), ADMIN_NO_SHOP_ACCESS_TH);
  });

  it("init-fail guard copy tells user to reopen / check network (Thai)", () => {
    assert.match(LIFF_INIT_FAIL_GUARD_TH, /[\u0E00-\u0E7F]/);
    assert.match(LIFF_INIT_FAIL_GUARD_TH, /LINE/);
    assert.match(LIFF_INIT_FAIL_GUARD_TH, /ปิด.*เปิด|อินเทอร์เน็ต/);
    assert.equal(thaiLiffAuthError(LIFF_INIT_FAIL_GUARD_TH), LIFF_INIT_FAIL_GUARD_TH);
  });
});
