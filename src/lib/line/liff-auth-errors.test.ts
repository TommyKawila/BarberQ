import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isExpiredLiffTokenError,
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

  it("keeps Thai messages as-is", () => {
    assert.equal(thaiLiffAuthError("โหลดไม่สำเร็จ"), "โหลดไม่สำเร็จ");
  });
});
