import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allowsPlatformAddFriendFallback,
  buildLineAddFriendUrl,
  resolveShopAddFriendUrl,
} from "@/lib/line/add-friend-url";
import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";

describe("buildLineAddFriendUrl", () => {
  it("builds line.me add-friend URL from @basicId", () => {
    assert.equal(
      buildLineAddFriendUrl("@myshop"),
      "https://line.me/R/ti/p/@myshop",
    );
  });

  it("prefixes @ when missing", () => {
    assert.equal(
      buildLineAddFriendUrl("clipperq"),
      "https://line.me/R/ti/p/@clipperq",
    );
  });

  it("rejects empty or invalid ids", () => {
    assert.equal(buildLineAddFriendUrl(null), null);
    assert.equal(buildLineAddFriendUrl(""), null);
    assert.equal(buildLineAddFriendUrl("   "), null);
    assert.equal(buildLineAddFriendUrl("@bad id"), null);
    assert.equal(buildLineAddFriendUrl("@x/y"), null);
  });
});

describe("resolveShopAddFriendUrl", () => {
  it("prefers shop oaBasicId over global fallback", () => {
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: "@shopoa",
        globalFallback: "https://line.me/R/ti/p/@global",
        allowGlobalFallback: true,
      }),
      "https://line.me/R/ti/p/@shopoa",
    );
  });

  it("falls back to global only when allowGlobalFallback is true (demo/test)", () => {
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: null,
        globalFallback: "https://line.me/R/ti/p/@demo",
        allowGlobalFallback: true,
      }),
      "https://line.me/R/ti/p/@demo",
    );
  });

  it("real shop with no basicId gets null — never platform OA URL", () => {
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: null,
        globalFallback: "https://line.me/R/ti/p/@platform",
        allowGlobalFallback: false,
      }),
      null,
    );
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: null,
        globalFallback: "https://line.me/R/ti/p/@platform",
      }),
      null,
    );
  });

  it("returns null when neither is available", () => {
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: null,
        globalFallback: "  ",
        allowGlobalFallback: true,
      }),
      null,
    );
  });
});

describe("allowsPlatformAddFriendFallback", () => {
  it("allows demo flag / demo slug and Founder QA pilot slug only", () => {
    assert.equal(allowsPlatformAddFriendFallback({ slug: "clipperqdemo", is_demo: true }), true);
    assert.equal(allowsPlatformAddFriendFallback({ slug: "clipperqdemo" }), true);
    assert.equal(
      allowsPlatformAddFriendFallback({ slug: FOUNDER_QA_MANIFEST.shop.slug }),
      true,
    );
    assert.equal(allowsPlatformAddFriendFallback({ slug: "realsalon" }), false);
    assert.equal(allowsPlatformAddFriendFallback({ slug: "phinxstudio" }), false);
  });
});
