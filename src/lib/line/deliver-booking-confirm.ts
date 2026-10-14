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

/**
 * Prefer free reply via liff.sendMessages → webhook.
 * If unavailable/fails, POST confirm-notify for quota-guarded push fallback.
 */
export async function deliverBookingLineConfirm(input: {
  liff: LiffSendMessagesApi;
  triggerText: string;
  confirmNotifyUrl: string;
  authHeaders: HeadersInit;
}): Promise<BookingConfirmDelivery> {
  const liffResult = await tryLiffSendMessages(input.liff, input.triggerText);
  if (liffResult.ok) {
    return { mode: "liff_reply_trigger", ok: true };
  }

  console.warn(
    JSON.stringify({
      event: "liff_send_messages_unavailable",
      reason: liffResult.reason,
      errorMessage: "errorMessage" in liffResult ? liffResult.errorMessage : undefined,
    }),
  );

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
          liffReason: liffResult.reason,
        }),
      );
      return {
        mode: "none",
        ok: false,
        liffReason: liffResult.reason,
        errorMessage: json.error?.message ?? `HTTP_${res.status}`,
      };
    }
    const sent = Boolean(json.sent);
    console.warn(
      JSON.stringify({
        event: "booking_confirm_push_fallback_result",
        sent,
        skippedReason: json.skippedReason ?? null,
        liffReason: liffResult.reason,
      }),
    );
    return {
      mode: sent ? "push_fallback" : "none",
      ok: sent,
      liffReason: liffResult.reason,
      pushSkippedReason: json.skippedReason ?? null,
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "booking_confirm_push_fallback_error",
        message: err instanceof Error ? err.message : "unknown",
        liffReason: liffResult.reason,
      }),
    );
    return {
      mode: "none",
      ok: false,
      liffReason: liffResult.reason,
      errorMessage: err instanceof Error ? err.message : "unknown",
    };
  }
}
