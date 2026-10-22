import {
  getOptionalClipperqLineToken,
  getOptionalOperatorLineUserId,
} from "@/lib/support/env";
import { pushMessages } from "@/lib/line/messaging-api";
import type { SupportTicket, SupportTicketStatus, SupportTicketType } from "@/lib/support/types";

async function pushViaClipperqOa(
  to: string,
  text: string,
  kind: string,
): Promise<{ sent: boolean; skipped?: string }> {
  const token = getOptionalClipperqLineToken();
  if (!token) {
    console.warn(
      JSON.stringify({
        event: "support_line_skipped",
        kind,
        reason: "missing_clipperq_line_token",
      }),
    );
    return { sent: false, skipped: "missing_token" };
  }
  const body = text.trim().slice(0, 4500);
  if (!to.trim() || !body) return { sent: false, skipped: "empty" };

  try {
    const result = await pushMessages(token, to.trim(), [{ type: "text", text: body }]);
    if (!result.ok) {
      console.warn(
        JSON.stringify({
          event: "support_line_failed",
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
        event: "support_line_failed",
        kind,
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
    return { sent: false, skipped: "api_error" };
  }
}

const TYPE_LABEL: Record<SupportTicketType, string> = {
  setup_help: "Setup help",
  problem: "Problem report",
  feature: "Feature request",
  crash: "Crash",
};

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  new: "ใหม่",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จแล้ว",
  wont_do: "จะไม่ทำ",
};

/** Alert Tommy on new / frequent tickets. No-op if env missing. */
export async function notifyOperatorNewTicket(input: {
  ticket: SupportTicket;
  shopName: string;
  shopSlug: string;
  frequent?: boolean;
}): Promise<{ sent: boolean; skipped?: string }> {
  const to = getOptionalOperatorLineUserId();
  if (!to) {
    console.warn(
      JSON.stringify({
        event: "support_line_skipped",
        kind: "new_ticket",
        reason: "missing_OPERATOR_LINE_USER_ID",
      }),
    );
    return { sent: false, skipped: "missing_operator_line_user_id" };
  }
  const freq = input.frequent
    ? ` · ×${input.ticket.occurrence_count}`
    : "";
  const text = [
    `[ClipperQ] ${TYPE_LABEL[input.ticket.type]}${freq}`,
    `${input.shopName} /${input.shopSlug}`,
    input.ticket.body.trim().slice(0, 200) || "(no body)",
    `id: ${input.ticket.id}`,
  ].join("\n");
  return pushViaClipperqOa(to, text, "operator_new_ticket");
}

/** Push ticket reply to shop owner via ClipperQ OA. */
export async function notifyOwnerTicketReply(input: {
  ownerLineUserId: string;
  shopName: string;
  ticketType: SupportTicketType;
  replyBody: string;
}): Promise<{ sent: boolean; skipped?: string }> {
  const text = [
    `[ClipperQ] ตอบรายงานของคุณ (${TYPE_LABEL[input.ticketType]})`,
    input.shopName,
    input.replyBody.trim().slice(0, 800),
    "",
    "เปิดแอป → เพิ่มเติม → รายงานของฉัน เพื่อดูรายละเอียด",
  ].join("\n");
  return pushViaClipperqOa(input.ownerLineUserId, text, "owner_ticket_reply");
}

/** Push status change to shop owner via ClipperQ OA. */
export async function notifyOwnerTicketStatus(input: {
  ownerLineUserId: string;
  shopName: string;
  ticketType: SupportTicketType;
  status: SupportTicketStatus;
}): Promise<{ sent: boolean; skipped?: string }> {
  const text = [
    `[ClipperQ] อัปเดตสถานะรายงาน`,
    input.shopName,
    `${TYPE_LABEL[input.ticketType]} → ${STATUS_LABEL[input.status]}`,
    "เปิดแอป → เพิ่มเติม → รายงานของฉัน",
  ].join("\n");
  return pushViaClipperqOa(input.ownerLineUserId, text, "owner_ticket_status");
}
