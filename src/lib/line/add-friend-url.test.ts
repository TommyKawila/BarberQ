import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLineAddFriendUrl,
  resolveShopAddFriendUrl,
} from "@/lib/line/add-friend-url";

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
      }),
      "https://line.me/R/ti/p/@shopoa",
    );
  });

  it("falls back to global when shop has no basicId", () => {
    assert.equal(
      resolveShopAddFriendUrl({
        oaBasicId: null,
        globalFallback: "https://line.me/R/ti/p/@demo",
      }),
      "https://line.me/R/ti/p/@demo",
    );
  });

  it("returns null when neither is available", () => {
    assert.equal(
      resolveShopAddFriendUrl({ oaBasicId: null, globalFallback: "  " }),
      null,
    );
  });
});
