/**
 * LINE Official Account (Thailand) message cost estimator.
 * Prices include VAT 7%, as of Oct 2026 — shops should verify in LINE OA Manager.
 * Client-side only; ClipperQ does not bill for LINE messages.
 */

export type LineOaPlanId = "free" | "basic" | "pro";

export type LineOaPlan = {
  id: LineOaPlanId;
  /** Monthly plan fee in THB including VAT. */
  monthlyFeeThb: number;
  /** Included push messages per calendar month. */
  includedMessages: number;
  /**
   * Overage price per message (THB incl VAT).
   * `null` for Free — Free cannot exceed the included quota.
   */
  overagePerMsgThb: number | null;
};

/** LINE OA Thailand plans (prices incl. VAT 7%, Oct 2026). */
export const LINE_OA_TH_PLANS: readonly LineOaPlan[] = [
  {
    id: "free",
    monthlyFeeThb: 0,
    includedMessages: 300,
    overagePerMsgThb: null,
  },
  {
    id: "basic",
    monthlyFeeThb: 1369.6,
    includedMessages: 15_000,
    overagePerMsgThb: 0.107,
  },
  {
    id: "pro",
    monthlyFeeThb: 1904.6,
    includedMessages: 35_000,
    overagePerMsgThb: 0.0642,
  },
] as const;

export type MessageCostInput = {
  queuesPerMonth: number;
  /** Booking confirmation push (1 message per queue when on). */
  confirmPush: boolean;
  /** Appointment reminder push (1 message per queue when on). */
  reminderPush: boolean;
  /**
   * Share of queues that also get a shop cancel/reschedule push (0–100).
   * Default 0. Adds `queues × percent/100` messages.
   */
  cancelReschedulePercent?: number;
};

export type PlanCostResult = {
  planId: LineOaPlanId;
  feasible: boolean;
  monthlyCostThb: number;
  overageMessages: number;
  overageCostThb: number;
};

export type MessageCostEstimate = {
  messagesPerQueue: number;
  monthlyMessages: number;
  recommended: PlanCostResult;
  /** Cost per queue for the recommended plan (null when queues is 0). */
  costPerQueueThb: number | null;
  /** Cost breakdown for every plan (Free may be infeasible). */
  plans: PlanCostResult[];
};

export type ComparisonScenarioId =
  | "confirm_and_reminder"
  | "reminder_only"
  | "confirm_only"
  | "all_off";

export type ComparisonRow = {
  scenarioId: ComparisonScenarioId;
  messagesPerQueue: number;
  monthlyMessages: number;
  planId: LineOaPlanId;
  monthlyCostThb: number;
  costPerQueueThb: number | null;
};

function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

function clampPercent(n: number | undefined): number {
  if (n == null || !Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/** Round money to 2 decimal places (satang). */
export function roundThb(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function messagesPerQueue(input: {
  confirmPush: boolean;
  reminderPush: boolean;
}): number {
  return (input.confirmPush ? 1 : 0) + (input.reminderPush ? 1 : 0);
}

/**
 * Monthly push volume:
 * `queues × msgs-per-queue + queues × (cancel%/100)`.
 */
export function estimateMonthlyMessages(input: MessageCostInput): number {
  const queues = clampNonNegative(input.queuesPerMonth);
  const perQueue = messagesPerQueue({
    confirmPush: input.confirmPush,
    reminderPush: input.reminderPush,
  });
  const cancelShare = queues * (clampPercent(input.cancelReschedulePercent) / 100);
  return queues * perQueue + cancelShare;
}

export function getPlan(planId: LineOaPlanId): LineOaPlan {
  const plan = LINE_OA_TH_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown LINE OA plan: ${planId}`);
  return plan;
}

/** Cost if the shop stays on a given plan for `monthlyMessages` pushes. */
export function costForPlan(
  planId: LineOaPlanId,
  monthlyMessages: number,
): PlanCostResult {
  const plan = getPlan(planId);
  const msgs = clampNonNegative(monthlyMessages);

  if (plan.overagePerMsgThb == null) {
    const feasible = msgs <= plan.includedMessages;
    return {
      planId,
      feasible,
      monthlyCostThb: feasible ? 0 : Number.POSITIVE_INFINITY,
      overageMessages: feasible ? 0 : Math.ceil(msgs - plan.includedMessages),
      overageCostThb: 0,
    };
  }

  const overageMessages = Math.max(0, msgs - plan.includedMessages);
  const overageCostThb = roundThb(overageMessages * plan.overagePerMsgThb);
  return {
    planId,
    feasible: true,
    monthlyCostThb: roundThb(plan.monthlyFeeThb + overageCostThb),
    overageMessages,
    overageCostThb,
  };
}

/**
 * Cheapest feasible package among Free / Basic / Pro.
 * Free wins when volume ≤ 300; otherwise compare Basic vs Pro (incl. overage).
 */
export function recommendPlan(monthlyMessages: number): PlanCostResult {
  const plans = LINE_OA_TH_PLANS.map((p) => costForPlan(p.id, monthlyMessages));
  const feasible = plans.filter((p) => p.feasible && Number.isFinite(p.monthlyCostThb));
  if (feasible.length === 0) {
    // Should not happen — Basic/Pro always feasible.
    return plans[plans.length - 1]!;
  }
  feasible.sort((a, b) => {
    if (a.monthlyCostThb !== b.monthlyCostThb) {
      return a.monthlyCostThb - b.monthlyCostThb;
    }
    // Prefer Free when tied at ฿0, else prefer higher included quota.
    const order: Record<LineOaPlanId, number> = { free: 0, basic: 1, pro: 2 };
    return order[a.planId] - order[b.planId];
  });
  return feasible[0]!;
}

export function estimateMessageCost(input: MessageCostInput): MessageCostEstimate {
  const queues = clampNonNegative(input.queuesPerMonth);
  const perQueue = messagesPerQueue({
    confirmPush: input.confirmPush,
    reminderPush: input.reminderPush,
  });
  const monthlyMessages = estimateMonthlyMessages(input);
  const plans = LINE_OA_TH_PLANS.map((p) => costForPlan(p.id, monthlyMessages));
  const recommended = recommendPlan(monthlyMessages);
  const costPerQueueThb =
    queues > 0 && Number.isFinite(recommended.monthlyCostThb)
      ? roundThb(recommended.monthlyCostThb / queues)
      : null;

  return {
    messagesPerQueue: perQueue,
    monthlyMessages,
    recommended,
    costPerQueueThb,
    plans,
  };
}

const COMPARISON_SCENARIOS: Array<{
  id: ComparisonScenarioId;
  confirmPush: boolean;
  reminderPush: boolean;
}> = [
  { id: "confirm_and_reminder", confirmPush: true, reminderPush: true },
  { id: "reminder_only", confirmPush: false, reminderPush: true },
  { id: "confirm_only", confirmPush: true, reminderPush: false },
  { id: "all_off", confirmPush: false, reminderPush: false },
];

/** Side-by-side scenarios for the same queue volume (+ optional cancel share). */
export function buildComparisonTable(input: {
  queuesPerMonth: number;
  cancelReschedulePercent?: number;
}): ComparisonRow[] {
  return COMPARISON_SCENARIOS.map((scenario) => {
    const estimate = estimateMessageCost({
      queuesPerMonth: input.queuesPerMonth,
      confirmPush: scenario.confirmPush,
      reminderPush: scenario.reminderPush,
      cancelReschedulePercent: input.cancelReschedulePercent,
    });
    return {
      scenarioId: scenario.id,
      messagesPerQueue: estimate.messagesPerQueue,
      monthlyMessages: estimate.monthlyMessages,
      planId: estimate.recommended.planId,
      monthlyCostThb: estimate.recommended.monthlyCostThb,
      costPerQueueThb: estimate.costPerQueueThb,
    };
  });
}
