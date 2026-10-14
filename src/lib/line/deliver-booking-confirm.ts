import {
  tryLiffSendMessages,
  type LiffSendMessagesApi,
  type LiffSendMessagesReason,
} from "@/lib/line/liff-send-messages";

export type BookingConfirmDelivery =
  | { mode: "liff_reply_trigger"; ok: true }
  | {
      mode: "push_fallback" | "none";
      ok: boolean;
      liffReason?: LiffSendMessagesReason;
      pushSkippedReason?: string | null;
      errorMessage?: string;
    };

async function requestPushFallback(input: {
  confirmNotifyUrl: string;
  authHeaders: HeadersInit;
  liffReason?: LiffSendMessagesReason;
}): Promise<BookingConfirmDelivery> {
  try {
    const res = await fetch(input.confirmNotifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...input.authHeaders,
      },
    });
    const json = (await res.json()) as {
      sent?: boolean;
      skippedReason?: string | null;
      error?: { message?: string };
    };
    if (!res.ok) {
      console.warn(
        JSON.stringify({
          event: "booking_confirm_push_fallback_failed",
          status: res.status,
          message: json.error?.message ?? "http_error",
          liffReason: input.liffReason,
        }),
      );
      return {
        mode: "none",
        ok: false,
        liffReason: input.liffReason,
        errorMessage: json.error?.message ?? `HTTP_${res.status}`,
      };
    }
    const skipped = json.skippedReason ?? null;
    // already_delivered = webhook reply already landed — treat as success
    if (skipped === "already_delivered") {
      console.warn(
        JSON.stringify({
          event: "booking_confirm_already_delivered",
          liffReason: input.liffReason,
        }),
      );
      return { mode: "liff_reply_trigger", ok: true };
    }
    const sent = Boolean(json.sent);
    console.warn(
      JSON.stringify({
        event: "booking_confirm_push_fallback_result",
        sent,
        skippedReason: skipped,
        liffReason: input.liffReason,
      }),
    );
    return {
      mode: sent ? "push_fallback" : "none",
      ok: sent,
      liffReason: input.liffReason,
      pushSkippedReason: skipped,
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "booking_confirm_push_fallback_error",
        message: err instanceof Error ? err.message : "unknown",
        liffReason: input.liffReason,
      }),
    );
    return {
      mode: "none",
      ok: false,
      liffReason: input.liffReason,
      errorMessage: err instanceof Error ? err.message : "unknown",
    };
  }
}

/**
 * Prefer free reply via liff.sendMessages → webhook.
 * Always follow with quota-guarded push fallback (server skips if reply already
 * landed) so OA chat still gets confirm/ticket when webhook/reply misses —
 * including serverless fire-and-forget kills and chat-context quirks.
 */
export async function deliverBookingLineConfirm(input: {
  liff: LiffSendMessagesApi;
  triggerText: string;
  confirmNotifyUrl: string;
  authHeaders: HeadersInit;
  /** @internal tests */
  replyGraceMs?: number;
}): Promise<BookingConfirmDelivery> {
  const liffResult = await tryLiffSendMessages(input.liff, input.triggerText);
  if (!liffResult.ok) {
    console.warn(
      JSON.stringify({
        event: "liff_send_messages_unavailable",
        reason: liffResult.reason,
        errorMessage: "errorMessage" in liffResult ? liffResult.errorMessage : undefined,
      }),
    );
    return requestPushFallback({
      confirmNotifyUrl: input.confirmNotifyUrl,
      authHeaders: input.authHeaders,
      liffReason: liffResult.reason,
    });
  }

  // Give webhook a brief window to reply before push insurance fires.
  const graceMs = input.replyGraceMs ?? 1500;
  if (graceMs > 0) {
    await new Promise((r) => setTimeout(r, graceMs));
  }
  return requestPushFallback({
    confirmNotifyUrl: input.confirmNotifyUrl,
    authHeaders: input.authHeaders,
    liffReason: "ok",
  });
}
