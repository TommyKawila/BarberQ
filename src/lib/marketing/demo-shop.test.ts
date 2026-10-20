import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_DEMO_SHOP_SLUG,
  demoShopBoardPath,
  demoShopBookingPath,
  demoShopBookingsPath,
  getDemoShopSlug,
} from "@/lib/marketing/demo-shop";
import { CLIPPERQ_OA_LINE_URL, resolveClipperqSupportLineUrl } from "@/lib/marketing/clipperq-oa";

const root = resolve(import.meta.dirname, "../../..");

describe("demo shop + ClipperQ OA constants", () => {
  it("defaults demo slug and stable paths", () => {
    const prev = process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG;
    delete process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG;
    assert.equal(getDemoShopSlug(), DEFAULT_DEMO_SHOP_SLUG);
    assert.equal(demoShopBookingPath(), `/${DEFAULT_DEMO_SHOP_SLUG}`);
    assert.equal(demoShopBoardPath(), `/${DEFAULT_DEMO_SHOP_SLUG}/admin`);
    assert.equal(demoShopBookingsPath(), `/${DEFAULT_DEMO_SHOP_SLUG}/bookings`);
    process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG = "clipperq-demo";
    assert.equal(getDemoShopSlug(), "clipperq-demo");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG;
    else process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG = prev;
  });

  it("resolves ClipperQ OA lin.ee fallback", () => {
    const prev = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
    delete process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
    assert.equal(resolveClipperqSupportLineUrl(), CLIPPERQ_OA_LINE_URL);
    process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL = "https://line.me/R/ti/p/@test";
    assert.equal(resolveClipperqSupportLineUrl(), "https://line.me/R/ti/p/@test");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
    else process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL = prev;
  });

  it("ships rich-menu PNG assets", () => {
    for (const name of [
      "shop-large.png",
      "shop-compact.png",
      "clipperq-oa-large.png",
      "clipperq-oa-compact.png",
    ]) {
      assert.equal(existsSync(resolve(root, "public/rich-menu", name)), true, name);
    }
  });
});
