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
    getContext: () => ({ type: "utou" }),
    sendMessages: async () => {},
    ...partial,
  };
}

describe("deliverBookingLineConfirm", () => {
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
      replyGraceMs: 0,
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
      replyGraceMs: 0,
    });
    assert.equal(result.mode, "push_fallback");
    assert.equal(
      result.mode === "push_fallback" ? result.liffReason : null,
      "not_in_client",
    );
  });

  it("still requests push insurance after successful sendMessages", async () => {
    let pushCalls = 0;
    globalThis.fetch = (async () => {
      pushCalls += 1;
      return new Response(
        JSON.stringify({ sent: false, skippedReason: "already_delivered" }),
        { status: 200 },
      );
    }) as typeof fetch;

    const result = await deliverBookingLineConfirm({
      liff: mockLiff({}),
      triggerText: "จอง #ABCDEF",
      confirmNotifyUrl: "/api/demo/bookings/1/confirm-notify",
      authHeaders: {},
      replyGraceMs: 0,
    });
    assert.equal(pushCalls, 1);
    assert.equal(result.mode, "liff_reply_trigger");
    assert.equal(result.ok, true);
  });

  it("uses push when sendMessages ok but reply never landed", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ sent: true, skippedReason: null }), {
        status: 200,
      })) as typeof fetch;

    const result = await deliverBookingLineConfirm({
      liff: mockLiff({}),
      triggerText: "จอง #ABCDEF",
      confirmNotifyUrl: "/api/demo/bookings/1/confirm-notify",
      authHeaders: {},
      replyGraceMs: 0,
    });
    assert.equal(result.mode, "push_fallback");
    assert.equal(result.ok, true);
  });
});
