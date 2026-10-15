import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeStatsReport } from "@/lib/admin/stats-report-safe";

describe("normalizeStatsReport", () => {
  it("returns null for garbage", () => {
    assert.equal(normalizeStatsReport(null), null);
    assert.equal(normalizeStatsReport({}), null);
  });

  it("fills missing D5 fields from legacy totals payload", () => {
    const report = normalizeStatsReport({
      range: { from: "2026-10-12", to: "2026-10-12", label: "2026-10-12", kind: "day" },
      totals: {
        uniqueCustomers: 2,
        booked: 3,
        cancelled: 1,
        completed: 1,
        noShow: 0,
        left: 0,
        walkIns: 1,
        newCustomers: 1,
        utilizationPct: 40,
        bySource: { line: 1, phone: 0, chat: 0, walk_in: 1 },
      },
      byHour: [{ hour: 10, booked: 5, walkIn: 0, free: 55 }],
      byBarber: [],
      trend: [],
      blocks: [],
    });
    assert.ok(report);
    assert.equal(report!.totals.revenueBaht, 0);
    assert.equal(report!.totals.returningRatePct, null);
    assert.equal(report!.totals.waitMinutesAvg, null);
    assert.equal(report!.totals.cancelNoShowRatePct, null);
    assert.equal(report!.totals.noShowRatePct, null);
    assert.equal(report!.comparison.completedDelta, 0);
    assert.equal(report!.byHour[0].blocked, 0);
    assert.equal(report!.byHour[0].chairBusyPct, 0);
    assert.equal(report!.insight.kind, "empty");
    assert.equal(report!.range.displayLabel, "2026-10-12");
  });

  it("preserves comparison when present", () => {
    const report = normalizeStatsReport({
      range: { from: "a", to: "b", label: "l", kind: "week", displayLabel: "1–7 ต.ค." },
      totals: {
        uniqueCustomers: 0,
        booked: 0,
        cancelled: 0,
        completed: 4,
        noShow: 0,
        left: 0,
        walkIns: 0,
        newCustomers: 0,
        returningCustomers: 0,
        returningRatePct: 50,
        cancelNoShowRatePct: 10,
        utilizationPct: 0,
        revenueBaht: 1000,
        waitMinutesAvg: 5,
        bySource: { line: 0, phone: 0, chat: 0, walk_in: 0 },
      },
      comparison: {
        completedDelta: 2,
        completedDeltaPct: 100,
        revenueDelta: 200,
        returningRateDeltaPct: 5,
        waitMinutesDelta: -1,
        cutoffApplied: true,
        previous: {
          from: "p",
          to: "q",
          completed: 2,
          revenueBaht: 800,
          returningRatePct: 45,
          waitMinutesAvg: 6,
        },
      },
      byHour: [],
      byBarber: [],
      trend: [],
      blocks: [],
      insight: { kind: "peak_hour", hour: 14 },
    });
    assert.ok(report);
    assert.equal(report!.comparison.completedDelta, 2);
    assert.equal(report!.insight.kind, "peak_hour");
    assert.equal(report!.range.displayLabel, "1–7 ต.ค.");
  });
});
