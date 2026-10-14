import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromZonedTime } from "date-fns-tz";
import { canCancelAt, CANCEL_LEAD_MINUTES, SHOP_TIMEZONE } from "@/lib/services/slot-service";

describe("canCancelAt (Bangkok)", () => {
  it("uses 60-minute cutoff against absolute timestamps (not calendar TZ drift)", () => {
    // Wed 14 Oct 2026 14:30 ICT
    const start = fromZonedTime("2026-10-14T14:30:00", SHOP_TIMEZONE);
    // Viewed at 13:51 ICT → 39 minutes before start → too late
    const at1351 = fromZonedTime("2026-10-14T13:51:00", SHOP_TIMEZONE);
    assert.equal(canCancelAt(start.toISOString(), at1351), false);

    // 13:30 ICT → exactly 60 minutes → allowed
    const at1330 = fromZonedTime("2026-10-14T13:30:00", SHOP_TIMEZONE);
    assert.equal(canCancelAt(start.toISOString(), at1330), true);

    // 13:29 ICT → 61 minutes → allowed
    const at1329 = fromZonedTime("2026-10-14T13:29:00", SHOP_TIMEZONE);
    assert.equal(canCancelAt(start.toISOString(), at1329), true);
  });

  it("documents the product cutoff constant", () => {
    assert.equal(CANCEL_LEAD_MINUTES, 60);
  });
});
