import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  it("uses shop oaBasicId only", () => {
    assert.equal(
      resolveShopAddFriendUrl({ oaBasicId: "@shopoa" }),
      "https://line.me/R/ti/p/@shopoa",
    );
  });

  it("returns null without oaBasicId — no platform OA fallback", () => {
    assert.equal(resolveShopAddFriendUrl({ oaBasicId: null }), null);
    assert.equal(resolveShopAddFriendUrl({ oaBasicId: "" }), null);
    assert.equal(resolveShopAddFriendUrl({}), null);
  });

  it("module has no platform fallback helpers or NEXT_PUBLIC_LINE_OA_ADD_URL", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/add-friend-url.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /allowsPlatformAddFriendFallback/);
    assert.doesNotMatch(src, /NEXT_PUBLIC_LINE_OA_ADD_URL/);
    assert.doesNotMatch(src, /globalFallback/);
    assert.doesNotMatch(src, /allowGlobalFallback/);
  });
});
