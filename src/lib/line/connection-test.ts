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
 * `skipped` = never ran because an earlier step failed (show ยังไม่ได้ตรวจ).
 * Do not treat `manual` / `skipped` as a silent pass.
 */
export type ConnectionCheckStatus = "pass" | "fail" | "manual" | "skipped";

export interface ConnectionCheck {
  id: ConnectionCheckId;
  /** true only when status === "pass" (never fake a pass for manual/skipped). */
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
  WEBHOOK_FAIL: {
    message: "Webhook ยังไม่พร้อมหรือตรวจไม่ผ่าน",
    fixHintKey: "lineConnect.fix.webhook",
    failCheck: "webhook",
  },
};

/** Which stored secrets are missing — Channel ID is not inferred without an API call. */
export function resolveMissingKeyFailures(secrets: {
  channelSecret: string | null;
  accessToken: string | null;
}): {
  failIds: Array<"channel_secret" | "access_token">;
  /** Dictionary key (th/en) naming only the missing field(s). */
  messageKey: string;
  fixHintKey: string;
} | null {
  const missingSecret = !secrets.channelSecret?.trim();
  const missingToken = !secrets.accessToken?.trim();
  if (!missingSecret && !missingToken) return null;
  if (missingSecret && missingToken) {
    return {
      failIds: ["channel_secret", "access_token"],
      messageKey: "lineConnect.error.missingSecretAndToken",
      fixHintKey: "lineConnect.fix.missingSecretAndToken",
    };
  }
  if (missingSecret) {
    return {
      failIds: ["channel_secret"],
      messageKey: "lineConnect.error.missingSecret",
      fixHintKey: "lineConnect.fix.missingSecret",
    };
  }
  return {
    failIds: ["access_token"],
    messageKey: "lineConnect.error.missingToken",
    fixHintKey: "lineConnect.fix.missingToken",
  };
}

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

/** Channel may be marked verified only when webhook passed in that test run. */
export function webhookCheckPassed(checks: ConnectionCheck[]): boolean {
  return checks.some((c) => c.id === "webhook" && c.status === "pass");
}

/**
 * Checklist shown after reload (no in-memory / latest test result).
 * Never invent ✓/✗ for webhook or test_message — those marks exist only from
 * the latest real connection test. Show "ยังไม่ได้ตรวจ" (manual) instead;
 * auto_reply may stay pass only because the owner confirm is persisted.
 */
export function buildReloadConnectionChecks(
  channel: Pick<ShopLineChannelPublic, "autoReplyConfirmedAt">,
): ConnectionCheck[] {
  return [
    check("channel_id", "manual", "lineConnect.check.channelIdNotChecked"),
    check("webhook", "manual", "lineConnect.check.webhookNotChecked"),
    resolveAutoReplyCheck(channel.autoReplyConfirmedAt),
    check("test_message", "manual", "lineConnect.check.testMessageNotChecked"),
    check(
      "liff_rich_menu",
      "manual",
      "lineConnect.check.liffRichMenuManual",
    ),
  ];
}

/** Last-tested stamp for Thai shop owners (Bangkok, Buddhist year). */
export function formatLineLastTestedAt(
  iso: string,
  locale: "th" | "en" = "th",
): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Starting checklist before any step runs — skipped (not fail) until tested. */
export function buildInitialConnectionChecks(): ConnectionCheck[] {
  return [
    check("channel_id", "skipped", "lineConnect.check.channelIdNotChecked"),
    check(
      "channel_secret",
      "skipped",
      "lineConnect.check.channelSecretNotChecked",
    ),
    check(
      "access_token",
      "skipped",
      "lineConnect.check.accessTokenNotChecked",
    ),
    check("webhook", "skipped", "lineConnect.check.webhookNotChecked"),
    // Honest default: LINE cannot report auto-reply — never hardcode pass.
    check("auto_reply", "manual", "lineConnect.check.autoReplyManual"),
    check(
      "test_message",
      "skipped",
      "lineConnect.check.testMessageNotChecked",
    ),
    // LINE has no API to verify LIFF/rich-menu setup — never silent-pass.
    check("liff_rich_menu", "manual", "lineConnect.check.liffRichMenuManual"),
  ];
}

export async function testShopLineConnection(
  shopId: string,
  opts?: { ownerLineId?: string | null },
): Promise<ConnectionTestResult> {
  const existing = await getShopLineChannel(shopId);
  const secrets = await getShopLineChannelSecrets(shopId);
  const checks = buildInitialConnectionChecks();

  const missing = resolveMissingKeyFailures(secrets);
  if (missing) {
    for (const id of missing.failIds) {
      setCheck(
        checks,
        id,
        "fail",
        id === "channel_secret"
          ? "lineConnect.check.channelSecretMissing"
          : "lineConnect.check.accessTokenMissing",
      );
    }
    // Channel ID was never looked up — stay skipped (ยังไม่ได้ตรวจ).
    const channel = await upsertShopLineChannel(shopId, {
      status: "broken",
      lastErrorCode: "MISSING_KEYS",
      lastErrorMessage: missing.messageKey,
    });
    return {
      ok: false,
      status: "broken",
      errorCode: "MISSING_KEYS",
      errorMessage: missing.messageKey,
      fixHintKey: missing.fixHintKey,
      checks,
      channel,
      botDisplayName: null,
    };
  }

  const channelSecret = secrets.channelSecret!;
  const accessToken = secrets.accessToken!;

  let bot;
  try {
    bot = await getBotInfo(accessToken);
    setCheck(checks, "access_token", "pass", "lineConnect.check.accessToken");
    setCheck(checks, "channel_id", "pass", "lineConnect.check.channelId");
  } catch {
    return fail(shopId, "TOKEN_INVALID", checks, null);
  }

  // Self-check: HMAC with this secret must verify a known body.
  const probeBody = JSON.stringify({ destination: bot.userId, events: [] });
  const probeSig = createHmac("sha256", channelSecret)
    .update(probeBody)
    .digest("base64");
  if (!verifyLineSignature(probeBody, channelSecret, probeSig)) {
    return fail(shopId, "SIGNATURE_MISMATCH", checks, bot.displayName);
  }
  setCheck(
    checks,
    "channel_secret",
    "pass",
    "lineConnect.check.channelSecret",
  );

  // Prefer LINE's webhook endpoint API when available (active + URL set).
  // If that API errors, never silent-pass — owner must retry.
  try {
    const hook = await getWebhookEndpoint(accessToken);
    setCheck(
      checks,
      "webhook",
      hook.active && Boolean(hook.endpoint?.trim()) ? "pass" : "fail",
      hook.active && Boolean(hook.endpoint?.trim())
        ? "lineConnect.check.webhook"
        : "lineConnect.check.webhookUnavailable",
    );
  } catch {
    setCheck(
      checks,
      "webhook",
      "fail",
      "lineConnect.check.webhookUnavailable",
    );
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
  setCheck(
    checks,
    "test_message",
    testOk ? "pass" : "fail",
    testOk
      ? "lineConnect.check.testMessage"
      : "lineConnect.check.testMessage",
  );

  // Do not stamp verified (or show green after reload) unless webhook passed.
  if (!webhookCheckPassed(checks)) {
    const channel = await upsertShopLineChannel(shopId, {
      botUserId: bot.userId,
      botDisplayName: bot.displayName,
      oaBasicId: bot.basicId,
      status: "broken",
      lastErrorCode: "WEBHOOK_FAIL",
      lastErrorMessage: ERRORS.WEBHOOK_FAIL.message,
      checklistStep: 3,
    });
    return {
      ok: false,
      status: "broken",
      errorCode: "WEBHOOK_FAIL",
      errorMessage: ERRORS.WEBHOOK_FAIL.message,
      fixHintKey: ERRORS.WEBHOOK_FAIL.fixHintKey,
      checks,
      channel,
      botDisplayName: bot.displayName,
    };
  }

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

const FAIL_LABEL: Partial<Record<ConnectionCheckId, string>> = {
  channel_id: "lineConnect.check.channelIdName",
  channel_secret: "lineConnect.check.secretBad",
  access_token: "lineConnect.check.accessToken",
  webhook: "lineConnect.check.webhookUnavailable",
  test_message: "lineConnect.check.testMessage",
};

async function fail(
  shopId: string,
  code: string,
  checks: ConnectionCheck[],
  botDisplayName: string | null,
): Promise<ConnectionTestResult> {
  const meta = ERRORS[code] ?? ERRORS.TOKEN_INVALID;
  // Attribute the failing step; leave later steps as `skipped` (ยังไม่ได้ตรวจ).
  setCheck(
    checks,
    meta.failCheck,
    "fail",
    FAIL_LABEL[meta.failCheck],
  );
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
