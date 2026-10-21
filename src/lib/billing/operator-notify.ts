import {
  getOptionalOperatorLineToken,
  getOptionalOperatorLineUserId,
} from "@/lib/billing/env";
import { pushMessages } from "@/lib/line/messaging-api";

export type OperatorNotifyKind =
  | "trial_started"
  | "shop_created"
  | "payment_submitted"
  | "payment_verified"
  | "payment_failed"
  | "payment_pending_review";

/**
 * Push a short Thai/EN text to Tommy's operator LINE user via ClipperQ OA.
 * Safe no-op when OPERATOR_LINE_USER_ID or OA token env is missing.
 */
export async function notifyOperator(
  kind: OperatorNotifyKind,
  text: string,
): Promise<{ sent: boolean; skipped?: string }> {
  const to = getOptionalOperatorLineUserId();
  const token = getOptionalOperatorLineToken();
  if (!to) {
    console.warn(
      JSON.stringify({
        event: "operator_line_skipped",
        kind,
        reason: "missing_OPERATOR_LINE_USER_ID",
      }),
    );
    return { sent: false, skipped: "missing_operator_line_user_id" };
  }
  if (!token) {
    console.warn(
      JSON.stringify({
        event: "operator_line_skipped",
        kind,
        reason: "missing_operator_line_token",
      }),
    );
    return { sent: false, skipped: "missing_token" };
  }
  const body = text.trim().slice(0, 4500);
  if (!body) return { sent: false, skipped: "empty" };

  try {
    const result = await pushMessages(token, to, [{ type: "text", text: body }]);
    if (!result.ok) {
      console.warn(
        JSON.stringify({
          event: "operator_line_failed",
          kind,
          status: result.status,
        }),
      );
      return { sent: false, skipped: "api_error" };
    }
    return { sent: true };
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "operator_line_failed",
        kind,
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
    return { sent: false, skipped: "api_error" };
  }
}

export function formatTrialStartedMessage(input: {
  shopName: string;
  shopSlug: string;
  ownerLineId: string;
  subscribedUntil: string | null;
}): string {
  return [
    "[ClipperQ] New 30-day trial",
    `Shop: ${input.shopName} (/${input.shopSlug})`,
    `Owner LINE: ${input.ownerLineId}`,
    input.subscribedUntil ? `Until: ${input.subscribedUntil}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatShopCreatedMessage(input: {
  shopName: string;
  shopSlug: string;
  mode: string;
}): string {
  return `[ClipperQ] Shop created (${input.mode})\n${input.shopName} /${input.shopSlug}`;
}

export function formatPaymentMessage(input: {
  kind: OperatorNotifyKind;
  shopName: string;
  shopSlug: string;
  amountBaht: number;
  paymentId: string;
  detail?: string;
}): string {
  const label: Record<string, string> = {
    payment_submitted: "Payment slip submitted",
    payment_verified: "Payment verified",
    payment_failed: "Payment verification failed",
    payment_pending_review: "Payment needs review",
  };
  return [
    `[ClipperQ] ${label[input.kind] ?? input.kind}`,
    `${input.shopName} /${input.shopSlug}`,
    `฿${input.amountBaht} · ${input.paymentId}`,
    input.detail ?? null,
  ]
    .filter(Boolean)
    .join("\n");
}
