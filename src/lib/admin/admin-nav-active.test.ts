import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_NAV_PATHS,
  ADMIN_STICKY_SAVE_BAR_CLASS,
  ADMIN_THUMB_BAR_OFFSET_CLASS,
  isMoreDestinationPath,
  isPrimaryNavActive,
  moreAdminNavItems,
} from "@/lib/admin/admin-nav-items";

const hrefs = {
  board: "/demo/admin",
  team: "/demo/admin/staff",
  schedule: "/demo/admin/my-schedule",
  stats: "/demo/admin/stats",
  settings: "/demo/admin/settings",
  notifications: "/demo/admin/settings/notifications",
  billing: "/demo/admin/billing",
  booking: "/demo",
};

describe("admin primary nav active state", () => {
  it("owner today/team/stats/more route active states", () => {
    const more = moreAdminNavItems("owner");
    assert.equal(isPrimaryNavActive("board", "/demo/admin", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("team", "/demo/admin/staff", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("team", "/demo/admin/staff/abc", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("stats", "/demo/admin/stats", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", "/demo/admin", hrefs, true, more), true);
  });

  it("owner schedule/settings/booking keep More active", () => {
    const more = moreAdminNavItems("owner");
    assert.equal(isPrimaryNavActive("more", hrefs.schedule, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.settings, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.booking, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("board", hrefs.settings, hrefs, false, more), false);
  });

  it("barber today/stats/more (schedule in More)", () => {
    const more = moreAdminNavItems("barber");
    assert.equal(isPrimaryNavActive("board", "/demo/admin", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("stats", hrefs.stats, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.booking, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.notifications, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.schedule, hrefs, false, more), true);
  });

  it("customer booking href is shop slug not generic slash", () => {
    assert.equal(ADMIN_NAV_PATHS.booking, "/");
    assert.equal(hrefs.booking, "/demo");
    assert.ok(isMoreDestinationPath("/demo", "booking", hrefs));
    assert.equal(isMoreDestinationPath("/", "booking", hrefs), false);
  });
});

describe("admin sticky save bar (iPad / lg sidebar)", () => {
  it("offsets past the w-56 sidebar and uses solid zinc + safe-area", () => {
    assert.match(ADMIN_STICKY_SAVE_BAR_CLASS, /lg:left-56/);
    assert.match(ADMIN_STICKY_SAVE_BAR_CLASS, /\bbg-zinc-950\b/);
    assert.match(ADMIN_STICKY_SAVE_BAR_CLASS, /border-t/);
    assert.match(ADMIN_STICKY_SAVE_BAR_CLASS, /safe-area-inset-bottom/);
    assert.doesNotMatch(ADMIN_STICKY_SAVE_BAR_CLASS, /backdrop-blur/);
    assert.doesNotMatch(ADMIN_STICKY_SAVE_BAR_CLASS, /bg-zinc-950\/95/);
  });

  it("barber edit page wires sticky save bar + thumb content padding", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/admin/staff/[id]/page.tsx"),
      "utf8",
    );
    assert.match(page, /ADMIN_STICKY_SAVE_BAR_CLASS/);
    assert.match(page, /ADMIN_THUMB_BAR_OFFSET_CLASS/);
    assert.match(page, /admin-sticky-save-bar/);
    assert.doesNotMatch(page, /ADMIN_NAV_STICKY_BOTTOM_CLASS/);
    assert.ok(ADMIN_THUMB_BAR_OFFSET_CLASS.includes("lg:pb-24"));
  });

  it("settings has no fixed sticky save bar (inline DirtyActions only)", () => {
    const settings = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/page.tsx"),
      "utf8",
    );
    assert.match(settings, /function DirtyActions/);
    assert.doesNotMatch(settings, /ADMIN_STICKY_SAVE_BAR_CLASS|ADMIN_NAV_STICKY_BOTTOM_CLASS/);
    assert.doesNotMatch(settings, /fixed inset-x-0.*saveChanges|admin\.saveChanges/);
  });
});
