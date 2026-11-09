import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolvePublicLineAddFriendUrl } from "@/lib/line/shop-add-friend";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

function channelStub(
  oaBasicId: string | null,
): ShopLineChannelPublic {
  return {
    shopId: "x",
    messagingChannelId: null,
    channelSecretLast4: null,
    accessTokenLast4: null,
    botUserId: null,
    botDisplayName: null,
    oaBasicId,
    plan: "free",
    monthlyPushBudget: 0,
    status: "pending",
    lastVerifiedAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 0,
    autoReplyConfirmedAt: null,
    hasSecret: false,
    hasAccessToken: false,
  };
}

describe("resolvePublicLineAddFriendUrl", () => {
  it("real shop without oa_basic_id returns null (hides add-friend)", async () => {
    const url = await resolvePublicLineAddFriendUrl(
      { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", slug: "realsalon", is_demo: false },
      { getChannel: async () => channelStub(null) },
    );
    assert.equal(url, null);
  });

  it("returns null when getShopLineChannel throws (booking settings still usable)", async () => {
    const url = await resolvePublicLineAddFriendUrl(
      { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", slug: "realsalon", is_demo: false },
      {
        getChannel: async () => {
          throw new Error("db down");
        },
      },
    );
    assert.equal(url, null);
  });

  it("demo/test shop without oa_basic_id also returns null — no platform OA", async () => {
    const demo = await resolvePublicLineAddFriendUrl(
      {
        id: "c1a55e00-d300-4000-a000-000000000001",
        slug: "clipperqdemo",
        is_demo: true,
      },
      { getChannel: async () => channelStub(null) },
    );
    assert.equal(demo, null);

    const qa = await resolvePublicLineAddFriendUrl(
      {
        id: "c1a55e00-d300-4000-a000-000000000002",
        slug: "barberqpilottest",
        is_demo: false,
      },
      { getChannel: async () => channelStub(null) },
    );
    assert.equal(qa, null);
  });

  it("uses shop oa_basic_id when present", async () => {
    const url = await resolvePublicLineAddFriendUrl(
      { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", slug: "realsalon", is_demo: false },
      { getChannel: async () => channelStub("@myshop") },
    );
    assert.equal(url, "https://line.me/R/ti/p/@myshop");
  });

  it("helper and settings route have no platform fallback path", () => {
    const helper = readFileSync(
      resolve(process.cwd(), "src/lib/line/shop-add-friend.ts"),
      "utf8",
    );
    assert.doesNotMatch(helper, /NEXT_PUBLIC_LINE_OA_ADD_URL/);
    assert.doesNotMatch(helper, /allowsPlatformAddFriendFallback/);
    assert.doesNotMatch(helper, /globalFallback/);

    const src = readFileSync(
      resolve(process.cwd(), "src/app/api/[shop]/settings/route.ts"),
      "utf8",
    );
    assert.match(src, /resolvePublicLineAddFriendUrl/);
    assert.doesNotMatch(src, /getShopLineChannel/);
    assert.doesNotMatch(src, /NEXT_PUBLIC_LINE_OA_ADD_URL/);
  });
});
