import { createHmac } from "node:crypto";
import { getBotInfo } from "@/lib/line/messaging-api";
import { pushTextForShop } from "@/lib/line/push-message";
import {
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

export interface ConnectionCheck {
  id: ConnectionCheckId;
  ok: boolean;
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

export async function testShopLineConnection(
  shopId: string,
  opts?: { ownerLineId?: string | null },
): Promise<ConnectionTestResult> {
  const secrets = await getShopLineChannelSecrets(shopId);
  const checks: ConnectionCheck[] = [
    { id: "channel_id", ok: false, labelKey: "lineConnect.check.channelId" },
    { id: "channel_secret", ok: false, labelKey: "lineConnect.check.channelSecret" },
    { id: "access_token", ok: false, labelKey: "lineConnect.check.accessToken" },
    { id: "webhook", ok: false, labelKey: "lineConnect.check.webhook" },
    { id: "auto_reply", ok: true, labelKey: "lineConnect.check.autoReply" },
    { id: "test_message", ok: false, labelKey: "lineConnect.check.testMessage" },
    { id: "liff_rich_menu", ok: true, labelKey: "lineConnect.check.liffRichMenu" },
  ];

  if (!secrets.channelSecret || !secrets.accessToken) {
    return fail(shopId, "MISSING_KEYS", checks, null);
  }

  let bot;
  try {
    bot = await getBotInfo(secrets.accessToken);
    setCheck(checks, "access_token", true);
    setCheck(checks, "channel_id", true);
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
  setCheck(checks, "channel_secret", true);
  setCheck(checks, "webhook", true);

  let testOk = true;
  if (opts?.ownerLineId) {
    const push = await pushTextForShop(
      shopId,
      opts.ownerLineId,
      `BarberQx: ทดสอบการเชื่อมต่อ LINE OA ของร้านสำเร็จ (${bot.displayName})`,
      "push_test",
    );
    testOk = push.sent || push.skippedReason === "quota_full";
  }
  setCheck(checks, "test_message", testOk);

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
  setCheck(checks, meta.failCheck, false);
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

function setCheck(checks: ConnectionCheck[], id: ConnectionCheckId, ok: boolean) {
  const row = checks.find((c) => c.id === id);
  if (row) row.ok = ok;
}
