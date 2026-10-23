import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { myBookingsAuthPhase } from "@/lib/booking/my-bookings-auth";

describe("myBookingsAuthPhase", () => {
  it("shows auth loading until LIFF ready", () => {
    assert.equal(
      myBookingsAuthPhase({
        ready: false,
        hasProfile: false,
        mockMode: false,
        listLoading: true,
      }),
      "auth-loading",
    );
  });

  it("shows login CTA when ready without profile (list loading must not block)", () => {
    assert.equal(
      myBookingsAuthPhase({
        ready: true,
        hasProfile: false,
        mockMode: false,
        listLoading: true,
      }),
      "login",
    );
  });

  it("shows list loading only after profile exists", () => {
    assert.equal(
      myBookingsAuthPhase({
        ready: true,
        hasProfile: true,
        mockMode: false,
        listLoading: true,
      }),
      "list-loading",
    );
  });

  it("shows content when ready with profile and list loaded", () => {
    assert.equal(
      myBookingsAuthPhase({
        ready: true,
        hasProfile: true,
        mockMode: false,
        listLoading: false,
      }),
      "content",
    );
  });
});

describe("MyBookingsPage auth gate", () => {
  it("gates on !ready only; never couples list loading to login CTA", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(app)/bookings/page.tsx"),
      "utf8",
    );
    assert.match(page, /myBookingsAuthPhase/);
    assert.doesNotMatch(page, /if\s*\(\s*!ready\s*\|\|\s*loading\s*\)/);
  });
});
