import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_NAV_PATHS,
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

  it("barber today/schedule/more", () => {
    const more = moreAdminNavItems("barber");
    assert.equal(isPrimaryNavActive("board", "/demo/admin", hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("schedule", hrefs.schedule, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.booking, hrefs, false, more), true);
    assert.equal(isPrimaryNavActive("more", hrefs.schedule, hrefs, false, more), false);
  });

  it("customer booking href is shop slug not generic slash", () => {
    assert.equal(ADMIN_NAV_PATHS.booking, "/");
    assert.equal(hrefs.booking, "/demo");
    assert.ok(isMoreDestinationPath("/demo", "booking", hrefs));
    assert.equal(isMoreDestinationPath("/", "booking", hrefs), false);
  });
});
