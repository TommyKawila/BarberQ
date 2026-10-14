/**
 * Gate for liff.sendMessages — only works in LINE in-app chat with the OA
 * (rich menu / chat deep link) when chat_message.write is available.
 */

export type LiffSendMessagesReason =
  | "ok"
  | "not_logged_in"
  | "not_in_client"
  | "api_unavailable"
  | "bad_context"
  | "send_failed";

export type LiffChatContextType = "utou" | "room" | "group" | "none" | "externalBrowser" | string;

export interface LiffSendMessagesApi {
  isLoggedIn?: () => boolean;
  isInClient?: () => boolean;
  isApiAvailable?: (name: string) => boolean;
  getContext?: () => { type?: LiffChatContextType } | null;
  sendMessages?: (
    messages: Array<{ type: "text"; text: string }>,
  ) => Promise<void>;
}

const CHAT_CONTEXT_TYPES = new Set(["utou", "room", "group"]);

export function resolveLiffSendMessagesGate(
  liff: LiffSendMessagesApi,
): { canSend: true } | { canSend: false; reason: Exclude<LiffSendMessagesReason, "ok" | "send_failed"> } {
  if (!liff.isLoggedIn?.()) {
    return { canSend: false, reason: "not_logged_in" };
  }
  if (!liff.isInClient?.()) {
    return { canSend: false, reason: "not_in_client" };
  }
  if (!liff.isApiAvailable?.("sendMessages")) {
    // Common when LIFF was not opened from an OA chat context, or scope missing.
    return { canSend: false, reason: "api_unavailable" };
  }
  // sendMessages only works in a chat with the bot (rich menu inside OA chat = utou).
  if (typeof liff.getContext === "function") {
    const type = liff.getContext()?.type;
    if (type && !CHAT_CONTEXT_TYPES.has(type)) {
      return { canSend: false, reason: "bad_context" };
    }
  }
  return { canSend: true };
}

export async function tryLiffSendMessages(
  liff: LiffSendMessagesApi,
  text: string,
): Promise<{ ok: true } | { ok: false; reason: LiffSendMessagesReason; errorMessage?: string }> {
  try {
    const trigger = text.trim();
    if (!trigger) {
      return { ok: false, reason: "send_failed", errorMessage: "empty_trigger" };
    }

    const gate = resolveLiffSendMessagesGate(liff);
    if (!gate.canSend) {
      return { ok: false, reason: gate.reason };
    }

    await liff.sendMessages?.([{ type: "text", text: trigger }]);
    return { ok: true };
  } catch (err) {
    // LIFF bridge methods can throw unexpectedly on iOS — never bubble.
    return {
      ok: false,
      reason: "send_failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
