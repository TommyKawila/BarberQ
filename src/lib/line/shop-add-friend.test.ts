import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolvePublicLineAddFriendUrl } from "@/lib/line/shop-add-friend";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

const originalEnv = process.env.NEXT_PUBLIC_LINE_OA_ADD_URL;

afterEach(() => {
  if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_LINE_OA_ADD_URL;
  else process.env.NEXT_PUBLIC_LINE_OA_ADD_URL = originalEnv;
});

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
    process.env.NEXT_PUBLIC_LINE_OA_ADD_URL = "https://line.me/R/ti/p/@platform";
    const url = await resolvePublicLineAddFriendUrl(
      { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", slug: "realsalon", is_demo: false },
      { getChannel: async () => channelStub(null) },
    );
    assert.equal(url, null);
  });

  it("returns null when getShopLineChannel throws (booking settings still usable)", async () => {
    process.env.NEXT_PUBLIC_LINE_OA_ADD_URL = "https://line.me/R/ti/p/@platform";
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

  it("demo shop may use platform fallback when channel has no basicId", async () => {
    process.env.NEXT_PUBLIC_LINE_OA_ADD_URL = "https://line.me/R/ti/p/@demo";
    const url = await resolvePublicLineAddFriendUrl(
      {
        id: "c1a55e00-d300-4000-a000-000000000001",
        slug: "clipperqdemo",
        is_demo: true,
      },
      { getChannel: async () => channelStub(null) },
    );
    assert.equal(url, "https://line.me/R/ti/p/@demo");
  });

  it("uses shop oa_basic_id when present", async () => {
    process.env.NEXT_PUBLIC_LINE_OA_ADD_URL = "https://line.me/R/ti/p/@platform";
    const url = await resolvePublicLineAddFriendUrl(
      { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", slug: "realsalon", is_demo: false },
      { getChannel: async () => channelStub("@myshop") },
    );
    assert.equal(url, "https://line.me/R/ti/p/@myshop");
  });

  it("public settings route uses the safe helper", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/api/[shop]/settings/route.ts"),
      "utf8",
    );
    assert.match(src, /resolvePublicLineAddFriendUrl/);
    assert.doesNotMatch(src, /getShopLineChannel/);
  });
});
