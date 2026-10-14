import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { deliverBookingLineConfirm } from "@/lib/line/deliver-booking-confirm";
import type { LiffSendMessagesApi } from "@/lib/line/liff-send-messages";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockLiff(partial: LiffSendMessagesApi = {}): LiffSendMessagesApi {
  return {
    isLoggedIn: () => true,
    isInClient: () => true,
    isApiAvailable: () => true,
    sendMessages: async () => {},
    ...partial,
  };
}

describe("deliverBookingLineConfirm", () => {
  it("uses liff reply trigger when sendMessages works", async () => {
    let pushed = false;
    globalThis.fetch = (async () => {
      pushed = true;
      return new Response("{}");
    }) as typeof fetch;

    const result = await deliverBookingLineConfirm({
      liff: mockLiff({}),
      triggerText: "จอง #ABCDEF",
      confirmNotifyUrl: "/api/demo/bookings/1/confirm-notify",
      authHeaders: {},
    });
    assert.equal(result.mode, "liff_reply_trigger");
    assert.equal(result.ok, true);
    assert.equal(pushed, false);
  });

  it("falls back to push when sendMessages API unavailable", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ sent: true, skippedReason: null }), {
        status: 200,
      })) as typeof fetch;

    const result = await deliverBookingLineConfirm({
      liff: mockLiff({ isApiAvailable: () => false }),
      triggerText: "จอง #ABCDEF",
      confirmNotifyUrl: "/api/demo/bookings/1/confirm-notify",
      authHeaders: { Authorization: "Bearer U1" },
    });
    assert.equal(result.mode, "push_fallback");
    assert.equal(result.ok, true);
    assert.equal(
      result.mode === "push_fallback" ? result.liffReason : null,
      "api_unavailable",
    );
  });

  it("falls back when not in LINE client", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ sent: true }), { status: 200 })) as typeof fetch;

    const result = await deliverBookingLineConfirm({
      liff: mockLiff({ isInClient: () => false }),
      triggerText: "จอง #ABCDEF",
      confirmNotifyUrl: "/api/demo/bookings/1/confirm-notify",
      authHeaders: {},
    });
    assert.equal(result.mode, "push_fallback");
    assert.equal(
      result.mode === "push_fallback" ? result.liffReason : null,
      "not_in_client",
    );
  });
});
