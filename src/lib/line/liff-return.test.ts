import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildLiffLoginRedirectUriForPath,
  buildOwnerEntryLoginRedirectUri,
  clearLiffCallbackGuard,
  hasLiffCallbackGuard,
  isLiffOAuthCallback,
  isOwnerBrowserMismatchSearch,
  isSafeReturnPath,
  ownerBrowserMismatchHref,
  peekLastShopReturnPath,
  resolveLiffCallbackAction,
  saveLiffReturnPath,
  setLiffCallbackGuard,
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

  it("stops (no /owner redirect) when return path is missing on /", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: null,
      guardAlreadySet: false,
    });
    assert.deepEqual(action, { type: "stop" });
  });

  it("treats fallback `/` return path as missing — stop, not owner mismatch", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: "/",
      guardAlreadySet: false,
    });
    assert.deepEqual(action, { type: "stop" });
  });

  it("recovers via last-shop path when return path was lost (Safari Private)", () => {
    const action = resolveLiffCallbackAction({
      search: "?code=abc&liffClientId=1",
      returnPath: null,
      fallbackShopPath: "/phinxstudio",
      guardAlreadySet: false,
    });
    assert.deepEqual(action, {
      type: "forward",
      href: "/phinxstudio?code=abc&liffClientId=1",
    });
  });

  it("peekLastShopReturnPath builds safe /{slug}", () => {
    assert.equal(peekLastShopReturnPath("myshop"), "/myshop");
    assert.equal(peekLastShopReturnPath("evil/path"), null);
    assert.equal(peekLastShopReturnPath(null), null);
  });

  it("owner mismatch href stays available for /owner flow only", () => {
    assert.equal(ownerBrowserMismatchHref(), "/owner?login_error=browser");
    assert.equal(isOwnerBrowserMismatchSearch("?login_error=browser"), true);
    assert.equal(isOwnerBrowserMismatchSearch("?code=abc&liffClientId=1"), false);
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

  it("path-specific redirectUri preserves shop/admin return without cookie (Private)", () => {
    assert.equal(
      buildLiffLoginRedirectUriForPath(
        "/barberqpilottest",
        "https://barberq-qa.vercel.app",
      ),
      "https://barberq-qa.vercel.app/barberqpilottest",
    );
    assert.equal(
      buildLiffLoginRedirectUriForPath(
        "/barberqpilottest/admin/login?x=1",
        "https://barberq-qa.vercel.app/",
      ),
      "https://barberq-qa.vercel.app/barberqpilottest/admin/login",
    );
    assert.equal(
      buildLiffLoginRedirectUriForPath("/", "https://barberq-qa.vercel.app"),
      "https://barberq-qa.vercel.app",
    );
    assert.equal(
      buildLiffLoginRedirectUriForPath("//evil", "https://barberq-qa.vercel.app"),
      "https://barberq-qa.vercel.app",
    );
  });

  it("LiffCallbackRedirect uses resolveLiffCallbackAction (no self-loop fallback)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/liff/LiffCallbackRedirect.tsx"),
      "utf8",
    );
    assert.match(src, /resolveLiffCallbackAction/);
    assert.match(src, /setLiffCallbackGuard/);
    assert.match(src, /oauthCodeFromSearch/);
    assert.doesNotMatch(src, /consumeLiffReturnPath\(\);\s*\n\s*window\.location\.replace\(`\$\{path\}/);
  });
});

describe("liff callback guard across logins", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    (globalThis as { sessionStorage?: Storage }).sessionStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
      clear: () => memory.clear(),
      key: () => null,
      get length() {
        return memory.size;
      },
    } as Storage;
  });

  afterEach(() => {
    clearLiffCallbackGuard();
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  });

  it("after one successful login, a new login in the same tab can still forward", () => {
    // First OAuth callback forwarded — guard bound to that code.
    setLiffCallbackGuard("code-one");
    assert.equal(hasLiffCallbackGuard("code-one"), true);

    // Same code must not forward again (loop protection).
    assert.deepEqual(
      resolveLiffCallbackAction({
        search: "?code=code-one&liffClientId=1",
        returnPath: "/admin",
        guardAlreadySet: hasLiffCallbackGuard("code-one"),
      }),
      { type: "stop" },
    );

    // New login saves return path (clears guard) before liff.login.
    saveLiffReturnPath("/admin");
    assert.equal(hasLiffCallbackGuard("code-two"), false);

    // New OAuth code in the same tab can still forward.
    const action = resolveLiffCallbackAction({
      search: "?code=code-two&liffClientId=1",
      returnPath: "/admin",
      guardAlreadySet: hasLiffCallbackGuard("code-two"),
    });
    assert.deepEqual(action, {
      type: "forward",
      href: "/admin?code=code-two&liffClientId=1",
    });
  });

  it("guard bound to oauth code — different code forwards even if uncleared", () => {
    setLiffCallbackGuard("old-code");
    assert.equal(hasLiffCallbackGuard("new-code"), false);
    const action = resolveLiffCallbackAction({
      search: "?code=new-code&liffClientId=1",
      returnPath: "/bookings",
      guardAlreadySet: hasLiffCallbackGuard("new-code"),
    });
    assert.deepEqual(action, {
      type: "forward",
      href: "/bookings?code=new-code&liffClientId=1",
    });
  });
});
