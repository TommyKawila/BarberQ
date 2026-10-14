import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveLiffSendMessagesGate,
  tryLiffSendMessages,
  type LiffSendMessagesApi,
} from "@/lib/line/liff-send-messages";

function mockLiff(partial: LiffSendMessagesApi): LiffSendMessagesApi {
  return {
    isLoggedIn: () => true,
    isInClient: () => true,
    isApiAvailable: () => true,
    sendMessages: async () => {},
    ...partial,
  };
}

describe("liff sendMessages gate", () => {
  it("allows send when in-client, logged in, and API available", () => {
    assert.deepEqual(resolveLiffSendMessagesGate(mockLiff({})), { canSend: true });
  });

  it("blocks when not in LINE client (external browser)", () => {
    assert.deepEqual(resolveLiffSendMessagesGate(mockLiff({ isInClient: () => false })), {
      canSend: false,
      reason: "not_in_client",
    });
  });

  it("blocks when sendMessages API unavailable (no chat context / missing scope)", () => {
    assert.deepEqual(
      resolveLiffSendMessagesGate(mockLiff({ isApiAvailable: () => false })),
      { canSend: false, reason: "api_unavailable" },
    );
  });

  it("blocks when LIFF context is not an OA chat", () => {
    assert.deepEqual(
      resolveLiffSendMessagesGate(
        mockLiff({ getContext: () => ({ type: "externalBrowser" }) }),
      ),
      { canSend: false, reason: "bad_context" },
    );
  });

  it("allows utou context (1:1 OA chat / rich menu)", () => {
    assert.deepEqual(
      resolveLiffSendMessagesGate(mockLiff({ getContext: () => ({ type: "utou" }) })),
      { canSend: true },
    );
  });

  it("tryLiffSendMessages returns send_failed with message on throw", async () => {
    const result = await tryLiffSendMessages(
      mockLiff({
        sendMessages: async () => {
          throw new Error("permission denied: chat_message.write");
        },
      }),
      "จอง #A12F3B",
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "send_failed");
      assert.match(result.errorMessage ?? "", /chat_message\.write/);
    }
  });

  it("tryLiffSendMessages succeeds when gate passes", async () => {
    let sent = "";
    const result = await tryLiffSendMessages(
      mockLiff({
        sendMessages: async (msgs) => {
          sent = msgs[0]?.text ?? "";
        },
      }),
      "จอง #A12F3B",
    );
    assert.equal(result.ok, true);
    assert.equal(sent, "จอง #A12F3B");
  });
});
