import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_DEMO_SHOP_SLUG,
  demoShopBoardPath,
  demoShopBookingPath,
  demoShopBookingsPath,
  getDemoShopSlug,
  isDemoShopSlug,
} from "@/lib/marketing/demo-shop";
import { CLIPPERQ_OA_LINE_URL, resolveClipperqSupportLineUrl } from "@/lib/marketing/clipperq-oa";
import { findDemoShop, shopIsDemo } from "@/lib/demo/demo-shop-guards";
import { loadPublicDemoBoard, sanitizeDemoColumns } from "@/lib/demo/public-board";
import type { AdminColumn } from "@/types/booking";
import { pushMessagesForShop } from "@/lib/line/push-message";

const root = resolve(import.meta.dirname, "../../..");

describe("demo shop + ClipperQ OA constants", () => {
  it("defaults to clipperqdemo (never phinxstudio)", () => {
    const prev = process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG;
    delete process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG;
    assert.equal(DEFAULT_DEMO_SHOP_SLUG, "clipperqdemo");
    assert.equal(getDemoShopSlug(), "clipperqdemo");
    assert.equal(demoShopBookingPath(), "/clipperqdemo");
    assert.equal(demoShopBoardPath(), "/demo/board");
    assert.equal(demoShopBookingsPath(), "/clipperqdemo/bookings");
    assert.equal(isDemoShopSlug("clipperqdemo"), true);
    assert.equal(isDemoShopSlug("phinxstudio"), false);
    process.env.NEXT_PUBLIC_DEMO_SHOP_SLUG = "other-demo";
    assert.equal(getDemoShopSlug(), "other-demo");
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

  it("ships rich-menu PNG assets and seed SQL", () => {
    for (const name of [
      "shop-large.png",
      "shop-compact.png",
      "clipperq-oa-large.png",
      "clipperq-oa-compact.png",
    ]) {
      assert.equal(existsSync(resolve(root, "public/rich-menu", name)), true, name);
    }
    const seed = readFileSync(
      resolve(root, "supabase/scripts/seed_clipperq_demo_prod.sql"),
      "utf8",
    );
    const rollback = readFileSync(
      resolve(root, "supabase/scripts/rollback_clipperq_demo_prod.sql"),
      "utf8",
    );
    assert.match(seed, /clipperqdemo/);
    assert.match(seed, /is_demo/);
    assert.match(seed, /ON CONFLICT/i);
    assert.match(seed, /begin;/i);
    assert.match(seed, /ตัดผม \+ เฟด/);
    assert.match(seed, /ABORT: slug clipperqdemo already belongs/);
    assert.match(seed, /on conflict \(id\) do nothing/i);
    assert.match(
      seed,
      /update shops[\s\S]*?where id = 'c1a55e00-d300-4000-a000-000000000001'/i,
    );
    assert.doesNotMatch(
      seed,
      /update shops[\s\S]*?where slug = 'clipperqdemo'/i,
    );
    assert.match(rollback, /delete from shops/i);
    assert.match(
      rollback,
      /id = 'c1a55e00-d300-4000-a000-000000000001'\s+and is_demo = true/i,
    );
    assert.doesNotMatch(rollback, /where slug = 'clipperqdemo'/);
    const migration = readFileSync(
      resolve(root, "supabase/migrations/0040_shops_is_demo.sql"),
      "utf8",
    );
    assert.match(migration, /add column if not exists is_demo/i);
    assert.match(migration, /comment on column shops\.is_demo/i);
  });

  it("memory store has demo shop; public board strips PII", async () => {
    const shop = await findDemoShop();
    assert.ok(shop);
    assert.equal(shop.slug, "clipperqdemo");
    assert.equal(shopIsDemo(shop), true);
    const board = await loadPublicDemoBoard(shop);
    assert.ok(board.columns.length >= 1);
    for (const col of board.columns) {
      for (const slot of col.slots) {
        assert.equal("customerPhone" in slot, false);
        assert.equal("customerLineId" in slot, false);
        assert.equal("customerName" in slot, false);
      }
    }

    const dirty: AdminColumn[] = [
      {
        barber: {
          id: "b1",
          name: "Test",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: new Date().toISOString(),
        },
        slots: [
          {
            startTime: "2026-01-01T03:00:00.000Z",
            endTime: "2026-01-01T03:30:00.000Z",
            available: false,
            kind: "booked",
            customerName: "SECRET",
            customerPhone: "0812345678",
            customerLineId: "Usecret",
          },
        ],
      },
    ];
    const clean = sanitizeDemoColumns(dirty);
    assert.equal(clean[0].slots[0].label, "จองแล้ว");
    assert.equal("customerPhone" in clean[0].slots[0], false);
  });

  it("skips LINE push for demo shop id", async () => {
    const shop = await findDemoShop();
    assert.ok(shop);
    const result = await pushMessagesForShop(
      shop.id,
      "Udemo",
      [{ type: "text", text: "hi" }],
      "push_other",
    );
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, "disabled");
  });
});
