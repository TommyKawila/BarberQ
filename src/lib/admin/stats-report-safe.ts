import type {
  StatsComparison,
  StatsInsight,
  StatsReport,
  StatsTotals,
} from "@/lib/services/stats-service";

const EMPTY_SOURCE = { line: 0, phone: 0, chat: 0, walk_in: 0 };

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Normalize partial/legacy stats payloads so the Summary UI never crashes. */
export function normalizeStatsReport(raw: unknown): StatsReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<StatsReport> & { totals?: Partial<StatsTotals>; comparison?: Partial<StatsComparison> };
  if (!r.totals || typeof r.totals !== "object") return null;

  const totals: StatsTotals = {
    uniqueCustomers: num(r.totals.uniqueCustomers),
    booked: num(r.totals.booked),
    cancelled: num(r.totals.cancelled),
    completed: num(r.totals.completed),
    noShow: num(r.totals.noShow),
    left: num(r.totals.left),
    walkIns: num(r.totals.walkIns),
    newCustomers: num(r.totals.newCustomers),
    returningCustomers: num(r.totals.returningCustomers),
    returningRatePct: numOrNull(r.totals.returningRatePct),
    cancelNoShowRatePct: numOrNull(r.totals.cancelNoShowRatePct),
    noShowRatePct: numOrNull(r.totals.noShowRatePct),
    utilizationPct: num(r.totals.utilizationPct),
    revenueBaht: num(r.totals.revenueBaht),
    waitMinutesAvg: numOrNull(r.totals.waitMinutesAvg),
    bySource: {
      line: num(r.totals.bySource?.line),
      phone: num(r.totals.bySource?.phone),
      chat: num(r.totals.bySource?.chat),
      walk_in: num(r.totals.bySource?.walk_in),
    },
  };

  const comparison: StatsComparison = {
    completedDelta: num(r.comparison?.completedDelta),
    completedDeltaPct: numOrNull(r.comparison?.completedDeltaPct),
    revenueDelta: num(r.comparison?.revenueDelta),
    returningRateDeltaPct: numOrNull(r.comparison?.returningRateDeltaPct),
    waitMinutesDelta: numOrNull(r.comparison?.waitMinutesDelta),
    cutoffApplied: Boolean(r.comparison?.cutoffApplied),
    previous: {
      from: r.comparison?.previous?.from ?? "",
      to: r.comparison?.previous?.to ?? "",
      completed: num(r.comparison?.previous?.completed),
      revenueBaht: num(r.comparison?.previous?.revenueBaht),
      returningRatePct: numOrNull(r.comparison?.previous?.returningRatePct),
      waitMinutesAvg: numOrNull(r.comparison?.previous?.waitMinutesAvg),
    },
  };

  const insight: StatsInsight =
    r.insight && typeof r.insight === "object"
      ? r.insight
      : { kind: "empty" };

  return {
    range: {
      from: r.range?.from ?? "",
      to: r.range?.to ?? "",
      label: r.range?.label ?? "",
      kind: r.range?.kind ?? "day",
      displayLabel: r.range?.displayLabel ?? r.range?.label ?? "",
    },
    totals,
    comparison,
    byHour: Array.isArray(r.byHour)
      ? r.byHour.map((row) => ({
          hour: num(row.hour),
          booked: num(row.booked),
          walkIn: num(row.walkIn),
          free: num(row.free),
          blocked: num(row.blocked),
          chairBusyPct: num(row.chairBusyPct),
        }))
      : [],
    byBarber: Array.isArray(r.byBarber)
      ? r.byBarber.map((row) => ({
          barberId: String(row.barberId ?? ""),
          name: String(row.name ?? ""),
          booked: num(row.booked),
          completed: num(row.completed),
          cancelled: num(row.cancelled),
          minutes: num(row.minutes),
          revenueBaht: num(row.revenueBaht),
        }))
      : [],
    trend: Array.isArray(r.trend) ? r.trend : [],
    blocks: Array.isArray(r.blocks) ? r.blocks : [],
    insight,
  };
}

export function emptyStatsTotals(): StatsTotals {
  return {
    uniqueCustomers: 0,
    booked: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0,
    left: 0,
    walkIns: 0,
    newCustomers: 0,
    returningCustomers: 0,
    returningRatePct: null,
    cancelNoShowRatePct: null,
    noShowRatePct: null,
    utilizationPct: 0,
    revenueBaht: 0,
    waitMinutesAvg: null,
    bySource: { ...EMPTY_SOURCE },
  };
}
