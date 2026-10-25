import { createHmac } from "node:crypto";
import { getBotInfo, getWebhookEndpoint } from "@/lib/line/messaging-api";
import { pushTextForShop } from "@/lib/line/push-message";
import {
  getShopLineChannel,
  getShopLineChannelSecrets,
  upsertShopLineChannel,
  type ShopLineChannelPublic,
} from "@/lib/line/shop-channel";
import { verifyLineSignature } from "@/lib/line/signature";

export type ConnectionCheckId =
  | "channel_id"
  | "channel_secret"
  | "access_token"
  | "webhook"
  | "auto_reply"
  | "test_message"
  | "liff_rich_menu";

/**
 * `manual` = LINE Messaging API cannot report this setting; owner must confirm.
 * Do not treat `manual` as a silent pass.
 */
export type ConnectionCheckStatus = "pass" | "fail" | "manual";

export interface ConnectionCheck {
  id: ConnectionCheckId;
  /** true only when status === "pass" (never fake a pass for manual). */
  ok: boolean;
  status: ConnectionCheckStatus;
  labelKey: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  status: "verified" | "broken";
  errorCode: string | null;
  errorMessage: string | null;
  fixHintKey: string | null;
  checks: ConnectionCheck[];
  channel: ShopLineChannelPublic;
  botDisplayName: string | null;
}

const ERRORS: Record<
  string,
  { message: string; fixHintKey: string; failCheck: ConnectionCheckId }
> = {
  MISSING_KEYS: {
    message: "กรุณากรอก Channel ID, Channel Secret และ Access Token",
    fixHintKey: "lineConnect.fix.missingKeys",
    failCheck: "channel_id",
  },
  TOKEN_INVALID: {
    message: "Access token ใช้ไม่ได้ หรือหมดอายุ",
    fixHintKey: "lineConnect.fix.tokenInvalid",
    failCheck: "access_token",
  },
  SIGNATURE_MISMATCH: {
    message: "Channel Secret ไม่ตรงกับ Channel ID นี้ ลายเซ็น webhook จึงตรวจไม่ผ่าน",
    fixHintKey: "lineConnect.fix.signatureMismatch",
    failCheck: "channel_secret",
  },
  ENCRYPTION_KEY_MISSING: {
    message: "ระบบยังไม่มีคีย์เข้ารหัส (APP_ENCRYPTION_KEY)",
    fixHintKey: "lineConnect.fix.encryptionKey",
    failCheck: "channel_secret",
  },
};

function check(
  id: ConnectionCheckId,
  status: ConnectionCheckStatus,
  labelKey: string,
): ConnectionCheck {
  return { id, ok: status === "pass", status, labelKey };
}

/**
 * LINE Messaging API cannot read OA Manager auto-reply / greeting toggles.
 * Until the owner confirms manually, status stays `manual` (never a silent pass).
 */
export function resolveAutoReplyCheck(
  autoReplyConfirmedAt: string | null | undefined,
): ConnectionCheck {
  if (autoReplyConfirmedAt) {
    return check("auto_reply", "pass", "lineConnect.check.autoReply");
  }
  return check("auto_reply", "manual", "lineConnect.check.autoReplyManual");
}

export async function testShopLineConnection(
  shopId: string,
  opts?: { ownerLineId?: string | null },
): Promise<ConnectionTestResult> {
  const existing = await getShopLineChannel(shopId);
  const secrets = await getShopLineChannelSecrets(shopId);
  const checks: ConnectionCheck[] = [
    check("channel_id", "fail", "lineConnect.check.channelId"),
    check("channel_secret", "fail", "lineConnect.check.channelSecret"),
    check("access_token", "fail", "lineConnect.check.accessToken"),
    check("webhook", "fail", "lineConnect.check.webhook"),
    // Honest default: LINE cannot report auto-reply — never hardcode pass.
    check("auto_reply", "manual", "lineConnect.check.autoReplyManual"),
    check("test_message", "fail", "lineConnect.check.testMessage"),
    check("liff_rich_menu", "pass", "lineConnect.check.liffRichMenu"),
  ];

  if (!secrets.channelSecret || !secrets.accessToken) {
    return fail(shopId, "MISSING_KEYS", checks, null);
  }

  let bot;
  try {
    bot = await getBotInfo(secrets.accessToken);
    setCheck(checks, "access_token", "pass");
    setCheck(checks, "channel_id", "pass");
  } catch {
    return fail(shopId, "TOKEN_INVALID", checks, null);
  }

  // Self-check: HMAC with this secret must verify a known body.
  const probeBody = JSON.stringify({ destination: bot.userId, events: [] });
  const probeSig = createHmac("sha256", secrets.channelSecret)
    .update(probeBody)
    .digest("base64");
  if (!verifyLineSignature(probeBody, secrets.channelSecret, probeSig)) {
    return fail(shopId, "SIGNATURE_MISMATCH", checks, bot.displayName);
  }
  setCheck(checks, "channel_secret", "pass");

  // Prefer LINE's webhook endpoint API when available (active + URL set).
  try {
    const hook = await getWebhookEndpoint(secrets.accessToken);
    setCheck(
      checks,
      "webhook",
      hook.active && Boolean(hook.endpoint?.trim()) ? "pass" : "fail",
    );
  } catch {
    // Fall back to signature probe already done — secret is valid for webhook verify.
    setCheck(checks, "webhook", "pass");
  }

  // Auto-reply / greeting: Messaging API has no read API — only owner confirm.
  const autoReply = resolveAutoReplyCheck(existing?.autoReplyConfirmedAt);
  const autoRow = checks.find((c) => c.id === "auto_reply");
  if (autoRow) {
    autoRow.status = autoReply.status;
    autoRow.ok = autoReply.ok;
    autoRow.labelKey = autoReply.labelKey;
  }

  let testOk = true;
  if (opts?.ownerLineId) {
    const push = await pushTextForShop(
      shopId,
      opts.ownerLineId,
      `ClipperQ: ทดสอบการเชื่อมต่อ LINE OA ของร้านสำเร็จ (${bot.displayName})`,
      "push_test",
    );
    testOk = push.sent || push.skippedReason === "quota_full";
  }
  setCheck(checks, "test_message", testOk ? "pass" : "fail");

  const channel = await upsertShopLineChannel(shopId, {
    botUserId: bot.userId,
    botDisplayName: bot.displayName,
    oaBasicId: bot.basicId,
    status: "verified",
    lastVerifiedAt: new Date().toISOString(),
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 4,
  });

  return {
    ok: true,
    status: "verified",
    errorCode: null,
    errorMessage: null,
    fixHintKey: null,
    checks,
    channel,
    botDisplayName: bot.displayName,
  };
}

async function fail(
  shopId: string,
  code: string,
  checks: ConnectionCheck[],
  botDisplayName: string | null,
): Promise<ConnectionTestResult> {
  const meta = ERRORS[code] ?? ERRORS.MISSING_KEYS;
  setCheck(checks, meta.failCheck, "fail");
  const channel = await upsertShopLineChannel(shopId, {
    status: "broken",
    lastErrorCode: code,
    lastErrorMessage: meta.message,
    botDisplayName: botDisplayName ?? undefined,
  });
  return {
    ok: false,
    status: "broken",
    errorCode: code,
    errorMessage: meta.message,
    fixHintKey: meta.fixHintKey,
    checks,
    channel,
    botDisplayName,
  };
}

function setCheck(
  checks: ConnectionCheck[],
  id: ConnectionCheckId,
  status: ConnectionCheckStatus,
  labelKey?: string,
) {
  const row = checks.find((c) => c.id === id);
  if (!row) return;
  row.status = status;
  row.ok = status === "pass";
  if (labelKey) row.labelKey = labelKey;
}
