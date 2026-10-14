import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildComparisonTable,
  costForPlan,
  estimateMessageCost,
  estimateMonthlyMessages,
  messagesPerQueue,
  recommendPlan,
  roundThb,
} from "@/lib/line/message-cost-calc";

describe("messagesPerQueue", () => {
  it("counts confirm and reminder independently", () => {
    assert.equal(messagesPerQueue({ confirmPush: true, reminderPush: true }), 2);
    assert.equal(messagesPerQueue({ confirmPush: false, reminderPush: true }), 1);
    assert.equal(messagesPerQueue({ confirmPush: true, reminderPush: false }), 1);
    assert.equal(messagesPerQueue({ confirmPush: false, reminderPush: false }), 0);
  });
});

describe("estimateMonthlyMessages", () => {
  it("is queues × msgs-per-queue", () => {
    assert.equal(
      estimateMonthlyMessages({
        queuesPerMonth: 100,
        confirmPush: true,
        reminderPush: true,
      }),
      200,
    );
  });

  it("adds cancel/reschedule share", () => {
    // 100 queues × 2 + 10% cancel = 200 + 10
    assert.equal(
      estimateMonthlyMessages({
        queuesPerMonth: 100,
        confirmPush: true,
        reminderPush: true,
        cancelReschedulePercent: 10,
      }),
      210,
    );
  });

  it("clamps bad inputs", () => {
    assert.equal(
      estimateMonthlyMessages({
        queuesPerMonth: -5,
        confirmPush: true,
        reminderPush: true,
        cancelReschedulePercent: 150,
      }),
      0,
    );
    assert.equal(
      estimateMonthlyMessages({
        queuesPerMonth: 50,
        confirmPush: false,
        reminderPush: false,
        cancelReschedulePercent: -10,
      }),
      0,
    );
  });
});

describe("costForPlan / recommendPlan", () => {
  it("Free fits at or under 300 and costs 0", () => {
    const atCap = costForPlan("free", 300);
    assert.equal(atCap.feasible, true);
    assert.equal(atCap.monthlyCostThb, 0);
    assert.equal(recommendPlan(300).planId, "free");
  });

  it("Free cannot exceed 300", () => {
    const over = costForPlan("free", 301);
    assert.equal(over.feasible, false);
    assert.equal(recommendPlan(301).planId, "basic");
  });

  it("Basic monthly fee with no overage", () => {
    const r = costForPlan("basic", 10_000);
    assert.equal(r.feasible, true);
    assert.equal(r.monthlyCostThb, 1369.6);
    assert.equal(r.overageMessages, 0);
  });

  it("Basic overage uses ฿0.107/msg", () => {
    // 15_001 → 1 overage → 1369.6 + 0.107
    const r = costForPlan("basic", 15_001);
    assert.equal(r.overageMessages, 1);
    assert.equal(r.overageCostThb, 0.11); // roundThb(0.107)
    assert.equal(r.monthlyCostThb, roundThb(1369.6 + 0.107));
  });

  it("Pro is cheaper than Basic when volume is high with large overage", () => {
    // 40_000 msgs: Basic overage 25_000 × 0.107 = 2675 → total ~4044.6
    // Pro overage 5_000 × 0.0642 = 321 → total ~2225.6
    const basic = costForPlan("basic", 40_000);
    const pro = costForPlan("pro", 40_000);
    assert.ok(pro.monthlyCostThb < basic.monthlyCostThb);
    assert.equal(recommendPlan(40_000).planId, "pro");
  });

  it("recommends Basic for modest volume over Free", () => {
    assert.equal(recommendPlan(500).planId, "basic");
    assert.equal(recommendPlan(500).monthlyCostThb, 1369.6);
  });
});

describe("estimateMessageCost", () => {
  it("returns live estimate with cost per queue", () => {
    const est = estimateMessageCost({
      queuesPerMonth: 100,
      confirmPush: true,
      reminderPush: true,
    });
    assert.equal(est.messagesPerQueue, 2);
    assert.equal(est.monthlyMessages, 200);
    assert.equal(est.recommended.planId, "free");
    assert.equal(est.costPerQueueThb, 0);
  });

  it("null cost per queue when queues is 0", () => {
    const est = estimateMessageCost({
      queuesPerMonth: 0,
      confirmPush: true,
      reminderPush: false,
    });
    assert.equal(est.monthlyMessages, 0);
    assert.equal(est.costPerQueueThb, null);
  });

  it("cost per queue = monthly ÷ queues on Basic", () => {
    // 200 queues × 2 = 400 msgs → Basic ฿1369.60 → 13.70/queue
    const est = estimateMessageCost({
      queuesPerMonth: 200,
      confirmPush: true,
      reminderPush: true,
    });
    assert.equal(est.recommended.planId, "basic");
    assert.equal(est.recommended.monthlyCostThb, 1369.6);
    assert.equal(est.costPerQueueThb, roundThb(1369.6 / 200));
  });
});

describe("buildComparisonTable", () => {
  it("lists four scenarios with correct msgs-per-queue", () => {
    const rows = buildComparisonTable({ queuesPerMonth: 150 });
    assert.equal(rows.length, 4);
    assert.deepEqual(
      rows.map((r) => [r.scenarioId, r.messagesPerQueue, r.monthlyMessages]),
      [
        ["confirm_and_reminder", 2, 300],
        ["reminder_only", 1, 150],
        ["confirm_only", 1, 150],
        ["all_off", 0, 0],
      ],
    );
    assert.equal(rows[0]!.planId, "free");
    assert.equal(rows[3]!.planId, "free");
  });

  it("applies cancel share to every scenario", () => {
    const rows = buildComparisonTable({
      queuesPerMonth: 100,
      cancelReschedulePercent: 20,
    });
    // all_off: 0 + 20 cancel msgs
    assert.equal(rows.find((r) => r.scenarioId === "all_off")!.monthlyMessages, 20);
    // confirm+reminder: 200 + 20
    assert.equal(
      rows.find((r) => r.scenarioId === "confirm_and_reminder")!.monthlyMessages,
      220,
    );
  });
});
