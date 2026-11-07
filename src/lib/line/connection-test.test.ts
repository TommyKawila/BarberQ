import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildReloadConnectionChecks,
  resolveAutoReplyCheck,
  webhookCheckPassed,
  type ConnectionCheck,
} from "@/lib/line/connection-test";
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
      status: "broken",
      autoReplyConfirmedAt: null,
    });
    const webhook = list.find((c) => c.id === "webhook");
    const testMessage = list.find((c) => c.id === "test_message");
    assert.ok(webhook);
    assert.equal(webhook.status, "fail");
    assert.equal(webhook.ok, false);
    assert.ok(testMessage);
    assert.notEqual(testMessage.status, "pass");
    assert.equal(testMessage.ok, false);
  });

  it("verified reload may show webhook ✓ but never invents test_message ✓", () => {
    const list = buildReloadConnectionChecks({
      status: "verified",
      autoReplyConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(list.find((c) => c.id === "webhook")?.status, "pass");
    assert.equal(list.find((c) => c.id === "test_message")?.status, "manual");
    assert.equal(list.find((c) => c.id === "test_message")?.ok, false);
  });

  it("ConnectedCard uses buildReloadConnectionChecks (no hardcoded webhook/test pass)", () => {
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
