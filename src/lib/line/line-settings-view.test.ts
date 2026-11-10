import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveLineSettingsView } from "@/lib/line/line-settings-view";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

function channel(
  overrides: Partial<ShopLineChannelPublic> = {},
): ShopLineChannelPublic {
  return {
    shopId: "s1",
    messagingChannelId: null,
    channelSecretLast4: null,
    accessTokenLast4: null,
    botUserId: null,
    botDisplayName: null,
    oaBasicId: null,
    plan: "free",
    monthlyPushBudget: 300,
    status: "pending",
    lastVerifiedAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 1,
    autoReplyConfirmedAt: null,
    hasSecret: false,
    hasAccessToken: false,
    ...overrides,
  };
}

describe("resolveLineSettingsView", () => {
  it("null channel → checklist (wizard)", () => {
    assert.equal(resolveLineSettingsView(null), "checklist");
  });

  it("verified → connected", () => {
    assert.equal(
      resolveLineSettingsView(channel({ status: "verified", hasSecret: true })),
      "connected",
    );
  });

  it("broken keyless (MISSING_KEYS probe) → checklist, not error", () => {
    assert.equal(
      resolveLineSettingsView(
        channel({
          status: "broken",
          lastErrorCode: "MISSING_KEYS",
          hasSecret: false,
          hasAccessToken: false,
          messagingChannelId: null,
        }),
      ),
      "checklist",
    );
  });

  it("broken with saved keys → error", () => {
    assert.equal(
      resolveLineSettingsView(
        channel({
          status: "broken",
          hasSecret: true,
          messagingChannelId: "2000",
        }),
      ),
      "error",
    );
  });

  it("pending with secret → keys", () => {
    assert.equal(
      resolveLineSettingsView(channel({ status: "pending", hasSecret: true })),
      "keys",
    );
  });

  it("line settings page uses resolveLineSettingsView + back-to-checklist on error", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(src, /resolveLineSettingsView/);
    assert.match(src, /line-settings-back-to-checklist/);
    assert.match(src, /!loading && view === "checklist"/);
    assert.match(src, /data-testid="line-settings-help-card"/);
  });
});
