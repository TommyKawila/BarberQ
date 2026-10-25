import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildOwnerEntryLoginRedirectUri,
  isLiffOAuthCallback,
  isOwnerBrowserMismatchSearch,
  isSafeReturnPath,
  ownerBrowserMismatchHref,
  resolveLiffCallbackAction,
} from "@/lib/line/liff-return";

describe("liff return path / OAuth callback", () => {
  it("detects LIFF OAuth callback query", () => {
    assert.equal(isLiffOAuthCallback("?code=abc&liffClientId=123"), true);
    assert.equal(isLiffOAuthCallback("code=abc&liffClientId=123"), true);
    assert.equal(isLiffOAuthCallback("?code=abc"), false);
    assert.equal(isLiffOAuthCallback(""), false);
  });

  it("rejects unsafe return paths", () => {
    assert.equal(isSafeReturnPath("/owner"), true);
    assert.equal(isSafeReturnPath("//evil"), false);
    assert.equal(isSafeReturnPath("https://evil"), false);
  });

  it("forwards to stored return path with OAuth params", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: "/owner",
      guardAlreadySet: false,
    });
    assert.deepEqual(action, {
      type: "forward",
      href: "/owner?code=abc&liffClientId=1",
    });
  });

  it("does not loop when return path is missing (browser switch)", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: null,
      guardAlreadySet: false,
    });
    assert.equal(action.type, "browser_mismatch");
    assert.equal(action.href, ownerBrowserMismatchHref());
    assert.equal(action.href.includes("code="), false);
    assert.equal(isOwnerBrowserMismatchSearch(action.href.split("?")[1] ?? ""), true);
  });

  it("treats fallback `/` return path as missing (old consume behavior)", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: "/",
      guardAlreadySet: false,
    });
    assert.equal(action.type, "browser_mismatch");
  });

  it("stops when guard already set (max 1 automatic hop)", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: "/owner",
      guardAlreadySet: true,
    });
    assert.deepEqual(action, { type: "stop" });
  });

  it("owner entry redirectUri includes /owner so cookie is optional", () => {
    assert.equal(
      buildOwnerEntryLoginRedirectUri("https://barber-q-pi.vercel.app/foo"),
      "https://barber-q-pi.vercel.app/owner",
    );
  });

  it("LiffCallbackRedirect uses resolveLiffCallbackAction (no self-loop fallback)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/liff/LiffCallbackRedirect.tsx"),
      "utf8",
    );
    assert.match(src, /resolveLiffCallbackAction/);
    assert.match(src, /setLiffCallbackGuard/);
    assert.doesNotMatch(src, /consumeLiffReturnPath\(\);\s*\n\s*window\.location\.replace\(`\$\{path\}/);
  });
});
