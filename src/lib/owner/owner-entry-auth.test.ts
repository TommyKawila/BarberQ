import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ownerEntryPhase } from "@/lib/owner/owner-entry-auth";

describe("ownerEntryPhase", () => {
  it("shows auth loading until LIFF ready", () => {
    assert.equal(
      ownerEntryPhase({
        ready: false,
        loggedIn: false,
        mockMode: false,
        shopsLoading: true,
        shopCount: null,
        error: null,
        redirecting: false,
      }),
      "auth-loading",
    );
  });

  it("shows login CTA when ready without session (shops loading must not block)", () => {
    assert.equal(
      ownerEntryPhase({
        ready: true,
        loggedIn: false,
        mockMode: false,
        shopsLoading: true,
        shopCount: null,
        error: null,
        redirecting: false,
      }),
      "login",
    );
  });

  it("shows shops loading only after login", () => {
    assert.equal(
      ownerEntryPhase({
        ready: true,
        loggedIn: true,
        mockMode: false,
        shopsLoading: true,
        shopCount: null,
        error: null,
        redirecting: false,
      }),
      "shops-loading",
    );
  });

  it("shows empty / pick / redirecting from shop count", () => {
    assert.equal(
      ownerEntryPhase({
        ready: true,
        loggedIn: true,
        mockMode: false,
        shopsLoading: false,
        shopCount: 0,
        error: null,
        redirecting: false,
      }),
      "empty",
    );
    assert.equal(
      ownerEntryPhase({
        ready: true,
        loggedIn: true,
        mockMode: false,
        shopsLoading: false,
        shopCount: 2,
        error: null,
        redirecting: false,
      }),
      "pick",
    );
    assert.equal(
      ownerEntryPhase({
        ready: true,
        loggedIn: true,
        mockMode: false,
        shopsLoading: false,
        shopCount: 1,
        error: null,
        redirecting: false,
      }),
      "redirecting",
    );
  });
});

describe("OwnerEntry LIFF gate", () => {
  it("gates on ready vs login vs shops; uses origin redirect_uri + handoff timeout", () => {
    const owner = readFileSync(
      resolve(process.cwd(), "src/components/owner/OwnerEntry.tsx"),
      "utf8",
    );
    assert.match(owner, /ownerEntryPhase/);
    assert.match(owner, /buildLiffLoginRedirectUri/);
    assert.match(owner, /OWNER_LIFF_LOGIN_HANDOFF_TIMEOUT_MS/);
    assert.match(owner, /OWNER_LIFF_INIT_TIMEOUT_MS/);
    assert.match(owner, /isInClient/);
    assert.doesNotMatch(owner, /redirectUri:\s*`\$\{window\.location\.origin\}\/owner`/);
  });
});
