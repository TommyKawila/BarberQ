/**
 * Gate for liff.sendMessages — only works in LINE in-app chat with the OA
 * (rich menu / chat deep link) when chat_message.write is available.
 */

export type LiffSendMessagesReason =
  | "ok"
  | "not_logged_in"
  | "not_in_client"
  | "api_unavailable"
  | "send_failed";

export interface LiffSendMessagesApi {
  isLoggedIn?: () => boolean;
  isInClient?: () => boolean;
  isApiAvailable?: (name: string) => boolean;
  sendMessages?: (
    messages: Array<{ type: "text"; text: string }>,
  ) => Promise<void>;
}

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
  return { canSend: true };
}

export async function tryLiffSendMessages(
  liff: LiffSendMessagesApi,
  text: string,
): Promise<{ ok: true } | { ok: false; reason: LiffSendMessagesReason; errorMessage?: string }> {
  const trigger = text.trim();
  if (!trigger) {
    return { ok: false, reason: "send_failed", errorMessage: "empty_trigger" };
  }

  const gate = resolveLiffSendMessagesGate(liff);
  if (!gate.canSend) {
    return { ok: false, reason: gate.reason };
  }

  try {
    await liff.sendMessages?.([{ type: "text", text: trigger }]);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "send_failed",
      errorMessage: err instanceof Error ? err.message : "unknown",
    };
  }
}
