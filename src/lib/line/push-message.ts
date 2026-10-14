import { getOptionalLinePushToken } from "@/lib/env";
import { recordLineMessage, type LineMessageKind } from "@/lib/line/message-log";
import { pushMessages } from "@/lib/line/messaging-api";
import { getShopPushQuota } from "@/lib/line/quota";
import { getShopLineChannelSecrets } from "@/lib/line/shop-channel";

export type PushKind = Extract<
  LineMessageKind,
  | "push_cancel"
  | "push_reschedule"
  | "push_reminder"
  | "push_confirm"
  | "push_test"
  | "push_other"
>;

export interface PushResult {
  sent: boolean;
  skippedReason?:
    | "missing_token"
    | "quota_full"
    | "invalid_input"
    | "api_error"
    | "already_delivered"
    | "disabled";
  status?: number;
}

/**
 * @deprecated Global single-token push. Prefer pushTextForShop.
 * Kept so missing LINE_CHANNEL_ACCESS_TOKEN still no-ops safely in tests/legacy.
 */
export async function pushText(lineUserId: string, text: string): Promise<boolean> {
  const token = getOptionalLinePushToken();
  const to = lineUserId.trim();
  if (!token) {
    console.warn(
      JSON.stringify({
        event: "line_push_skipped",
        reason: "missing_channel_access_token",
      }),
    );
    return false;
  }
  if (!to || !text.trim()) return false;
  const result = await pushMessages(token, to, [{ type: "text", text }]);
  return result.ok;
}

export async function pushTextForShop(
  shopId: string,
  lineUserId: string,
  text: string,
  kind: PushKind = "push_other",
  appointmentId?: string | null,
): Promise<PushResult> {
  return pushMessagesForShop(
    shopId,
    lineUserId,
    [{ type: "text", text }],
    kind,
    appointmentId,
  );
}

export async function pushMessagesForShop(
  shopId: string,
  lineUserId: string,
  messages: unknown[],
  kind: PushKind,
  appointmentId?: string | null,
): Promise<PushResult> {
  const to = lineUserId.trim();
  if (!to || messages.length === 0) {
    return { sent: false, skippedReason: "invalid_input" };
  }

  const quota = await getShopPushQuota(shopId);
  if (!quota.canPush) {
    console.warn(
      JSON.stringify({
        event: "line_push_skipped",
        reason: "quota_full",
        shopId,
        used: quota.used,
        budget: quota.budget,
      }),
    );
    await recordLineMessage({
      shopId,
      kind,
      counted: false,
      recipientLineId: to,
      appointmentId,
      success: false,
      errorCode: "QUOTA_FULL",
    });
    return { sent: false, skippedReason: "quota_full" };
  }

  const secrets = await getShopLineChannelSecrets(shopId);
  const token = secrets.accessToken ?? getOptionalLinePushToken();
  if (!token) {
    console.warn(
      JSON.stringify({
        event: "line_push_skipped",
        reason: "missing_channel_access_token",
        shopId,
      }),
    );
    return { sent: false, skippedReason: "missing_token" };
  }

  const result = await pushMessages(token, to, messages);
  await recordLineMessage({
    shopId,
    kind,
    counted: result.ok,
    recipientLineId: to,
    appointmentId,
    success: result.ok,
    errorCode: result.ok ? null : `HTTP_${result.status}`,
  });
  if (!result.ok) {
    return { sent: false, skippedReason: "api_error", status: result.status };
  }
  return { sent: true, status: result.status };
}
