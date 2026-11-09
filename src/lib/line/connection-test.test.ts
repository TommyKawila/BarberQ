import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildInitialConnectionChecks,
  buildReloadConnectionChecks,
  formatLineLastTestedAt,
  resolveAutoReplyCheck,
  webhookCheckPassed,
  type ConnectionCheck,
} from "@/lib/line/connection-test";
import { dictionary } from "@/lib/i18n/dictionary";
import {
  __resetShopLineChannelsForTests,
  buildShopLineChannelUpsertRow,
  upsertShopLineChannel,
  type ShopLineChannelRow,
} from "@/lib/line/shop-channel";

const shopId = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  __resetShopLineChannelsForTests();
});

describe("resolveAutoReplyCheck", () => {
  it("returns manual (not pass) when owner has not confirmed — LINE cannot report auto-reply", () => {
    const check = resolveAutoReplyCheck(null);
    assert.equal(check.id, "auto_reply");
    assert.equal(check.status, "manual");
    assert.equal(check.ok, false);
    assert.equal(check.labelKey, "lineConnect.check.autoReplyManual");
  });

  it("returns pass only after autoReplyConfirmedAt is set", () => {
    const check = resolveAutoReplyCheck("2026-10-25T00:00:00.000Z");
    assert.equal(check.status, "pass");
    assert.equal(check.ok, true);
    assert.equal(check.labelKey, "lineConnect.check.autoReply");
  });
});

describe("honest connection checklist defaults", () => {
  it("webhook API errors become fail (not pass); LIFF+rich menu starts manual", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/connection-test.ts"),
      "utf8",
    );
    assert.match(src, /lineConnect\.check\.webhookUnavailable/);
    assert.match(src, /setCheck\(\s*checks,\s*"webhook",\s*"fail"/);
    assert.doesNotMatch(
      src,
      /catch \{\s*\/\/ Fall back[\s\S]*?setCheck\(\s*checks,\s*"webhook",\s*"pass"/,
    );
    assert.match(
      src,
      /check\("liff_rich_menu", "manual", "lineConnect\.check\.liffRichMenuManual"\)/,
    );
    assert.doesNotMatch(src, /check\("liff_rich_menu", "pass"/);
    assert.match(src, /webhookCheckPassed\(checks\)/);
    assert.match(src, /WEBHOOK_FAIL/);
  });
});

describe("verified gate + reload honesty", () => {
  it("webhook fail means not verified gate", () => {
    const checks: ConnectionCheck[] = [
      {
        id: "webhook",
        ok: false,
        status: "fail",
        labelKey: "lineConnect.check.webhookUnavailable",
      },
      {
        id: "test_message",
        ok: true,
        status: "pass",
        labelKey: "lineConnect.check.testMessage",
      },
    ];
    assert.equal(webhookCheckPassed(checks), false);
  });

  it("webhook fail → reload does not show ✓ for webhook or test_message", () => {
    const list = buildReloadConnectionChecks({
      autoReplyConfirmedAt: null,
    });
    const webhook = list.find((c) => c.id === "webhook");
    const testMessage = list.find((c) => c.id === "test_message");
    assert.ok(webhook);
    assert.notEqual(webhook.status, "pass");
    assert.equal(webhook.ok, false);
    assert.equal(webhook.status, "manual");
    assert.equal(webhook.labelKey, "lineConnect.check.webhookNotChecked");
    assert.ok(testMessage);
    assert.notEqual(testMessage.status, "pass");
    assert.equal(testMessage.ok, false);
    assert.equal(
      testMessage.labelKey,
      "lineConnect.check.testMessageNotChecked",
    );
  });

  it("verified reload never invents webhook/test_message ✓ — neutral unchecked labels", () => {
    const list = buildReloadConnectionChecks({
      autoReplyConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(list.find((c) => c.id === "webhook")?.status, "manual");
    assert.equal(list.find((c) => c.id === "webhook")?.ok, false);
    assert.equal(
      list.find((c) => c.id === "webhook")?.labelKey,
      "lineConnect.check.webhookNotChecked",
    );
    assert.equal(list.find((c) => c.id === "test_message")?.status, "manual");
    assert.equal(list.find((c) => c.id === "test_message")?.ok, false);
    assert.equal(
      list.find((c) => c.id === "test_message")?.labelKey,
      "lineConnect.check.testMessageNotChecked",
    );
    assert.equal(list.find((c) => c.id === "channel_id")?.status, "manual");
    assert.equal(
      list.find((c) => c.id === "channel_id")?.labelKey,
      "lineConnect.check.channelIdNotChecked",
    );
    assert.equal(list.find((c) => c.id === "auto_reply")?.status, "pass");
  });

  it("Thai dictionary unchecked labels use neutral names (not pass-result wording)", () => {
    assert.equal(
      dictionary.th["lineConnect.check.channelIdNotChecked"],
      "Channel ID — ยังไม่ได้ตรวจ",
    );
    assert.equal(
      dictionary.th["lineConnect.check.webhookNotChecked"],
      "Webhook — ยังไม่ได้ตรวจ",
    );
    assert.equal(
      dictionary.th["lineConnect.check.testMessageNotChecked"],
      "ข้อความทดสอบ — ยังไม่ได้ตรวจ",
    );
    assert.doesNotMatch(
      dictionary.th["lineConnect.check.channelIdNotChecked"],
      /พบแล้ว/,
    );
    assert.doesNotMatch(
      dictionary.th["lineConnect.check.webhookNotChecked"],
      /รับข้อความได้/,
    );
    assert.doesNotMatch(
      dictionary.th["lineConnect.check.testMessageNotChecked"],
      /ส่งข้อความทดสอบถึงเจ้าของร้านแล้ว/,
    );
    assert.equal(
      dictionary.en["lineConnect.check.channelIdNotChecked"],
      "Channel ID — not checked yet",
    );
  });

  it("ConnectedCard uses buildReloadConnectionChecks + Thai help link + Bangkok last-tested", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(src, /buildReloadConnectionChecks/);
    assert.doesNotMatch(
      src,
      /id: "webhook", ok: true, status: "pass"/,
    );
    assert.doesNotMatch(
      src,
      /id: "test_message", ok: true, status: "pass"/,
    );
    assert.match(src, /lineConnect\.autoReplyHelpLink/);
    assert.match(
      src,
      /help2\.line\.me\/official_account_th\/web\/categoryId\/200000662/,
    );
    assert.doesNotMatch(src, /developers\.line\.biz/);
    assert.match(src, /inline-flex min-h-11 items-center/);
    assert.match(src, /formatLineLastTestedAt/);
    assert.doesNotMatch(src, /toLocaleString\(\)/);
  });

  it("formatLineLastTestedAt uses th-TH Asia/Bangkok (not US month/day)", () => {
    const formatted = formatLineLastTestedAt("2026-11-07T14:42:01.000Z", "th");
    assert.match(formatted, /7/);
    assert.match(formatted, /พ\.ย\.|พย/);
    assert.match(formatted, /2569/);
    assert.doesNotMatch(formatted, /11\/7\/2026/);
    assert.doesNotMatch(formatted, /PM|AM/);
  });
});

describe("auto-reply confirm persistence", () => {
  it("stores and clears autoReplyConfirmedAt around secret rotation", async () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
    const first = await upsertShopLineChannel(shopId, {
      messagingChannelId: "1",
      channelSecret: "secret-one",
      accessToken: "token-one",
      autoReplyConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(first.autoReplyConfirmedAt, "2026-01-01T00:00:00.000Z");

    const rotated = await upsertShopLineChannel(shopId, {
      channelSecret: "secret-two",
    });
    assert.equal(rotated.autoReplyConfirmedAt, null);

    const confirmed = await upsertShopLineChannel(shopId, {
      autoReplyConfirmedAt: "2026-02-01T00:00:00.000Z",
    });
    assert.equal(confirmed.autoReplyConfirmedAt, "2026-02-01T00:00:00.000Z");
  });
});

describe("buildShopLineChannelUpsertRow", () => {
  const base = {
    shopId,
    messagingChannelId: "1",
    channelSecretLast4: "cret",
    accessTokenLast4: "oken",
    botUserId: null,
    botDisplayName: null,
    oaBasicId: null,
    plan: "free" as const,
    monthlyPushBudget: 300,
    status: "pending" as const,
    lastVerifiedAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 0,
    autoReplyConfirmedAt: null,
    hasSecret: true,
    hasAccessToken: true,
    channelSecretEnc: "enc",
    accessTokenEnc: "enc",
  } satisfies ShopLineChannelRow;

  it("omits auto_reply_confirmed_at when unchanged (safe before migration 0051)", () => {
    const existing = { ...base, autoReplyConfirmedAt: null };
    const next = { ...base, autoReplyConfirmedAt: null, status: "verified" as const };
    const row = buildShopLineChannelUpsertRow(existing, next);
    assert.equal("auto_reply_confirmed_at" in row, false);
    assert.equal(row.status, "verified");
  });

  it("includes auto_reply_confirmed_at only when the value changes", () => {
    const existing = { ...base, autoReplyConfirmedAt: null };
    const next = {
      ...base,
      autoReplyConfirmedAt: "2026-03-01T00:00:00.000Z",
    };
    const row = buildShopLineChannelUpsertRow(existing, next);
    assert.equal(row.auto_reply_confirmed_at, "2026-03-01T00:00:00.000Z");
  });
});

describe("line settings checklist colors", () => {
  it("failed items use danger token mapping; manual uses amber token", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(src, /text-red-400/);
    assert.match(src, /text-amber-400/);
    assert.doesNotMatch(src, /text-orange-400/);
    assert.doesNotMatch(src, /text-amber-300/);
  });
});

describe("skipped checks on early failure (error card)", () => {
  it("initial checks start as skipped with ยังไม่ได้ตรวจ labels (not pass wording)", () => {
    const list = buildInitialConnectionChecks();
    const skippedIds = [
      "channel_id",
      "channel_secret",
      "access_token",
      "webhook",
      "test_message",
    ] as const;
    for (const id of skippedIds) {
      const row = list.find((c) => c.id === id);
      assert.ok(row);
      assert.equal(row.status, "skipped");
      assert.equal(row.ok, false);
      assert.match(row.labelKey, /NotChecked$/);
      assert.doesNotMatch(dictionary.th[row.labelKey as keyof typeof dictionary.th], /พบแล้ว|ตรง|ใช้ได้|รับข้อความได้|ส่งข้อความทดสอบถึงเจ้าของร้านแล้ว/);
      assert.match(
        dictionary.th[row.labelKey as keyof typeof dictionary.th],
        /ยังไม่ได้ตรวจ/,
      );
    }
    assert.equal(list.find((c) => c.id === "auto_reply")?.status, "manual");
    assert.equal(list.find((c) => c.id === "liff_rich_menu")?.status, "manual");
  });

  it("ErrorCard renders skipped neutrally (zinc ○) not green/pass", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(src, /status === "skipped"/);
    assert.match(src, /text-zinc-400/);
    assert.match(src, /skipped \? "○"/);
    // ErrorCard must not treat skipped as red fail with only ok ? green : red
    const errorCard = src.slice(
      src.indexOf("function ErrorCard"),
      src.indexOf("function ConnectedCard"),
    );
    assert.match(errorCard, /skipped/);
    assert.match(errorCard, /text-zinc-400/);
    assert.doesNotMatch(
      errorCard,
      /className=\{c\.ok \? "text-emerald-400" : "text-red-400"\}/,
    );
  });

  it("Thai not-checked keys for secret/token exist with ยังไม่ได้ตรวจ", () => {
    assert.equal(
      dictionary.th["lineConnect.check.channelSecretNotChecked"],
      "Channel Secret — ยังไม่ได้ตรวจ",
    );
    assert.equal(
      dictionary.th["lineConnect.check.accessTokenNotChecked"],
      "Access token — ยังไม่ได้ตรวจ",
    );
    assert.equal(
      dictionary.en["lineConnect.check.channelSecretNotChecked"],
      "Channel Secret — not checked yet",
    );
    assert.equal(
      dictionary.en["lineConnect.check.accessTokenNotChecked"],
      "Access token — not checked yet",
    );
  });
});
