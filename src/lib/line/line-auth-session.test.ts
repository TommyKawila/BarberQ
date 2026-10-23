import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canUseCustomerBookingSession,
  hasLineAccessToken,
} from "./line-auth-session";

describe("line-auth-session", () => {
  it("requires a non-empty access token outside mock mode", () => {
    assert.equal(hasLineAccessToken(null), false);
    assert.equal(hasLineAccessToken(""), false);
    assert.equal(hasLineAccessToken("  "), false);
    assert.equal(hasLineAccessToken("eyJhbGciOi..."), true);
  });

  it("blocks booking UI when logged-in profile has no access token (plain web)", () => {
    assert.equal(
      canUseCustomerBookingSession({
        mockMode: false,
        loggedIn: true,
        accessToken: null,
      }),
      false,
    );
    assert.equal(
      canUseCustomerBookingSession({
        mockMode: false,
        loggedIn: true,
        accessToken: "token",
      }),
      true,
    );
    assert.equal(
      canUseCustomerBookingSession({
        mockMode: true,
        loggedIn: false,
        accessToken: null,
      }),
      true,
    );
  });
});
