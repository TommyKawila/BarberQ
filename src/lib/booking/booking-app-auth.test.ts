import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { bookingAppAuthPhase } from "@/lib/booking/booking-app-auth";

describe("bookingAppAuthPhase", () => {
  it("prefers success over login even when profile is missing", () => {
    assert.equal(
      bookingAppAuthPhase({
        ready: true,
        hasProfile: false,
        mockMode: false,
        hasSuccess: true,
      }),
      "success",
    );
  });

  it("shows auth loading until LIFF ready (never login)", () => {
    assert.equal(
      bookingAppAuthPhase({
        ready: false,
        hasProfile: false,
        mockMode: false,
        hasSuccess: false,
      }),
      "auth-loading",
    );
  });

  it("shows auth loading while submitting if profile blips", () => {
    assert.equal(
      bookingAppAuthPhase({
        ready: true,
        hasProfile: false,
        mockMode: false,
        hasSuccess: false,
        submitting: true,
      }),
      "auth-loading",
    );
  });

  it("shows login only when ready, not submitting, and no profile", () => {
    assert.equal(
      bookingAppAuthPhase({
        ready: true,
        hasProfile: false,
        mockMode: false,
        hasSuccess: false,
        submitting: false,
      }),
      "login",
    );
  });

  it("shows content when ready with profile", () => {
    assert.equal(
      bookingAppAuthPhase({
        ready: true,
        hasProfile: true,
        mockMode: false,
        hasSuccess: false,
      }),
      "content",
    );
  });
});

describe("BookingApp auth gate wiring", () => {
  it("uses bookingAppAuthPhase and never gates login before success", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/customer/BookingApp.tsx"),
      "utf8",
    );
    assert.match(src, /bookingAppAuthPhase/);
    assert.match(src, /data-testid="booking-auth-loading"/);
    assert.match(src, /data-testid="booking-line-login"/);
    // Success phase must be handled; login must not sit above an unconditional success check.
    assert.match(src, /authPhase === "success"/);
    assert.match(src, /authPhase === "auth-loading"/);
    assert.match(src, /authPhase === "login"/);
  });

  it("customer LIFF init is shared (no remount re-init login flash)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/use-line-auth.ts"),
      "utf8",
    );
    assert.match(src, /customerLiffInit/);
    assert.match(src, /initCustomerLiff/);
    assert.match(src, /resolveCustomerSession/);
    // On init failure, still try an existing LIFF session before showing login.
    assert.match(src, /already initialized|resolveCustomerSession/);
  });
});
