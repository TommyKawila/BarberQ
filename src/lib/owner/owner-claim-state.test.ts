import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildOwnerLiffLoginRedirectUri,
  canStartOwnerLineLogin,
  resolveOwnerAuthPhaseAfterLiffInit,
  shouldAutoClaimOwner,
  shouldShowOwnerLoginCta,
} from "@/lib/owner/owner-claim-state";

describe("owner claim auth state", () => {
  it("valid invite + already logged in with token => authenticated + auto claim", () => {
    const phase = resolveOwnerAuthPhaseAfterLiffInit({
      isLoggedIn: true,
      accessToken: "line-access-token",
    });
    assert.equal(phase, "authenticated");
    assert.equal(
      shouldAutoClaimOwner({
        authPhase: phase,
        previewReady: true,
        previewExpired: false,
        previewClaimed: false,
        claimed: false,
        claimAttempted: false,
      }),
      true,
    );
    assert.equal(shouldShowOwnerLoginCta({ authPhase: phase, claiming: false }), false);
  });

  it("valid invite + not logged in => login CTA rendered", () => {
    const phase = resolveOwnerAuthPhaseAfterLiffInit({
      isLoggedIn: false,
      accessToken: null,
    });
    assert.equal(phase, "needs_login");
    assert.equal(shouldShowOwnerLoginCta({ authPhase: phase, claiming: false }), true);
    assert.equal(
      shouldAutoClaimOwner({
        authPhase: phase,
        previewReady: true,
        previewExpired: false,
        previewClaimed: false,
        claimed: false,
        claimAttempted: false,
      }),
      false,
    );
  });

  it("isLoggedIn without access token treated as needs login", () => {
    const phase = resolveOwnerAuthPhaseAfterLiffInit({
      isLoggedIn: true,
      accessToken: null,
    });
    assert.equal(phase, "needs_login");
    assert.equal(shouldShowOwnerLoginCta({ authPhase: phase, claiming: false }), true);
  });

  it("login CTA requires needs_login phase and invite code", () => {
    assert.equal(
      canStartOwnerLineLogin({
        authPhase: "needs_login",
        inviteCode: "abc123",
        mockMode: false,
      }),
      true,
    );
    assert.equal(
      canStartOwnerLineLogin({
        authPhase: "initializing",
        inviteCode: "abc123",
        mockMode: false,
      }),
      false,
    );
    assert.equal(
      canStartOwnerLineLogin({
        authPhase: "needs_login",
        inviteCode: null,
        mockMode: false,
      }),
      false,
    );
  });

  it("LIFF init error phase does not auto claim or show login until resolved", () => {
    assert.equal(
      shouldAutoClaimOwner({
        authPhase: "init_failed",
        previewReady: true,
        previewExpired: false,
        previewClaimed: false,
        claimed: false,
        claimAttempted: false,
      }),
      false,
    );
    assert.equal(shouldShowOwnerLoginCta({ authPhase: "init_failed", claiming: false }), false);
  });

  it("failed claim does not retry when claimAttempted is true", () => {
    assert.equal(
      shouldAutoClaimOwner({
        authPhase: "authenticated",
        previewReady: true,
        previewExpired: false,
        previewClaimed: false,
        claimed: false,
        claimAttempted: true,
      }),
      false,
    );
  });

  it("login CTA invokes HTTPS LIFF redirect and preserves invite", () => {
    const https = buildOwnerLiffLoginRedirectUri({
      pageOrigin: "https://barber-q-pi.vercel.app",
      appUrl: "https://barber-q-pi.vercel.app",
      inviteCode: "abc123",
    });
    assert.equal(https, "https://barber-q-pi.vercel.app/owner/join?invite=abc123");
    const fromLocal = buildOwnerLiffLoginRedirectUri({
      pageOrigin: "http://localhost:3000",
      appUrl: "https://barber-q-pi.vercel.app",
      inviteCode: "abc123",
    });
    assert.equal(fromLocal, "https://barber-q-pi.vercel.app/owner/join?invite=abc123");
    assert.equal(fromLocal.startsWith("https://"), true);
  });
});
