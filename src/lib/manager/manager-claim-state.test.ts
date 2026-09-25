import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManagerLiffLoginRedirectUri,
  canStartManagerLineLogin,
  resolveManagerAuthPhaseAfterLiffInit,
  shouldAutoClaimManager,
  shouldShowManagerLoginCta,
} from "@/lib/manager/manager-claim-state";

describe("manager claim auth state", () => {
  it("valid invite + already logged in with token => authenticated + auto claim", () => {
    const phase = resolveManagerAuthPhaseAfterLiffInit({
      isLoggedIn: true,
      accessToken: "line-access-token",
    });
    assert.equal(phase, "authenticated");
    assert.equal(
      shouldAutoClaimManager({
        authPhase: phase,
        previewReady: true,
        claimed: false,
        claimAttempted: false,
      }),
      true,
    );
    assert.equal(shouldShowManagerLoginCta({ authPhase: phase, claiming: false }), false);
  });

  it("valid invite + not logged in => login CTA rendered", () => {
    const phase = resolveManagerAuthPhaseAfterLiffInit({
      isLoggedIn: false,
      accessToken: null,
    });
    assert.equal(phase, "needs_login");
    assert.equal(shouldShowManagerLoginCta({ authPhase: phase, claiming: false }), true);
    assert.equal(
      shouldAutoClaimManager({
        authPhase: phase,
        previewReady: true,
        claimed: false,
        claimAttempted: false,
      }),
      false,
    );
  });

  it("login CTA invokes HTTPS LIFF redirect to manager join", () => {
    const https = buildManagerLiffLoginRedirectUri({
      pageOrigin: "https://barber-q-pi.vercel.app",
      appUrl: "https://barber-q-pi.vercel.app",
      inviteCode: "abc123",
    });
    assert.equal(https, "https://barber-q-pi.vercel.app/manager/join?invite=abc123");
    assert.equal(https.includes("/owner/join"), false);
  });

  it("login CTA requires needs_login phase and invite code", () => {
    assert.equal(
      canStartManagerLineLogin({
        authPhase: "needs_login",
        inviteCode: "abc123",
        mockMode: false,
      }),
      true,
    );
    assert.equal(
      canStartManagerLineLogin({
        authPhase: "needs_login",
        inviteCode: null,
        mockMode: false,
      }),
      false,
    );
  });
});
