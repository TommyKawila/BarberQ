"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, addMonths, subDays, subMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  Armchair,
  Banknote,
  RefreshCw,
  RotateCcw,
  UserX,
} from "lucide-react";
import { BarberBars } from "@/components/admin/charts/BarberBars";
import { BlockTimeline } from "@/components/admin/charts/BlockTimeline";
import { HourlyBars } from "@/components/admin/charts/HourlyBars";
import { StatCard } from "@/components/admin/charts/StatCard";
import { TrendBars } from "@/components/admin/charts/TrendBars";
import { AdminContentSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminShell } from "@/components/admin/AdminShell";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { shouldShowStatsSampleLabel } from "@/lib/admin/stats-sample-label";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { normalizeStatsReport } from "@/lib/admin/stats-report-safe";
import type { StatsRange, StatsReport } from "@/lib/services/stats-service";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";

interface ApiError {
  error?: { code?: string; message?: string };
}

const RANGES: StatsRange[] = ["day", "week", "month"];

function shiftDate(kind: StatsRange, dateISO: string, dir: -1 | 1): string {
  const noon = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
  if (kind === "day") {
    return formatInTimeZone(dir > 0 ? addDays(noon, 1) : subDays(noon, 1), SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  if (kind === "week") {
    return formatInTimeZone(dir > 0 ? addDays(noon, 7) : subDays(noon, 7), SHOP_TIMEZONE, "yyyy-MM-dd");
  }
  return formatInTimeZone(dir > 0 ? addMonths(noon, 1) : subMonths(noon, 1), SHOP_TIMEZONE, "yyyy-MM-dd");
}

export default function AdminStatsPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopSlug } = useShopSlug();
  const toast = useToast();
  const online = useOnlineStatus();
  // Opt-in ?cqSample=1 only (never default on in QA/prod deploys)
  const [showSampleLabel, setShowSampleLabel] = useState(false);
  useEffect(() => {
    setShowSampleLabel(shouldShowStatsSampleLabel(window.location.search));
  }, []);

  const [range, setRange] = useState<StatsRange>("week");
  const [dateISO, setDateISO] = useState(() => dateISOFromInstant(new Date()));
  const [report, setReport] = useState<StatsReport | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(
        shopApi(`/stats?range=${encodeURIComponent(range)}&date=${encodeURIComponent(dateISO)}`),
        { headers: authHeaders },
      );
      const json = (await res.json()) as StatsReport & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.loadFailed"));
        setOffline(false);
        setReport(null);
        toast.error(t("admin.toast.refreshFailed"));
        return;
      }
      const normalized = normalizeStatsReport(json);
      if (!normalized) {
        setError(t("admin.loadFailed"));
        setReport(null);
        return;
      }
      setError(null);
      setOffline(false);
      setReport(normalized);
    } catch {
      setOffline(true);
      setError(t("admin.statsOffline"));
      setReport(null);
      toast.error(t("admin.toast.refreshFailed"));
    } finally {
      setLoadingStats(false);
    }
  }, [authHeaders, dateISO, range, shopApi, t, toast]);

  useEffect(() => {
    if (!ready || !profile) return;
    void loadStats();
  }, [loadStats, profile, ready]);

  async function copyBookingLink() {
    const url = buildShopLiffUrl(shopSlug) || buildShopWebUrl(shopSlug);
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success(t("admin.toast.copyBookingLink"));
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  if (!ready || !profile) {
    return (
      <AdminShell role="owner">
        <AdminContentSkeleton />
      </AdminShell>
    );
  }

  const totals = report?.totals;
  const comparison = report?.comparison;
  const isOperator = isShopOperatorRole(profile.role);
  const isEmpty = totals != null && totals.completed === 0 && totals.booked === 0;
  const title = isOperator ? t("admin.stats") : t("admin.statsMySummary");

  function peakLine(): string {
    const insight = report?.insight as
      | (NonNullable<StatsReport["insight"]> & { label?: string })
      | undefined;
    if (!insight || insight.kind === "empty" || (totals?.completed ?? 0) === 0) {
      return t("admin.statsPeakLabel").replace("{hint}", "—");
    }
    if (insight.label) {
      return t("admin.statsPeakLabel").replace("{hint}", insight.label);
    }
    if (insight.kind === "peak_hour" && insight.hour != null) {
      const hh = String(insight.hour).padStart(2, "0");
      return t("admin.statsPeakLabel").replace("{hint}", `${hh}:00`);
    }
    if (insight.kind === "quiet_hour" && insight.hour != null) {
      return t("admin.statsInsightQuiet").replace("{hour}", String(insight.hour));
    }
    if (insight.kind === "trend_up") return t("admin.statsInsightUp");
    if (insight.kind === "trend_down") return t("admin.statsInsightDown");
    return t("admin.statsPeakLabel").replace("{hint}", "—");
  }

  const rangeSubtitle = report?.range.displayLabel ?? dateISO;
  const insufficient = t("admin.statsInsufficientData");

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-3 py-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold">{title}</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {showSampleLabel ? `${t("admin.statsSampleLabel")} · ` : ""}
              {rangeSubtitle}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("admin.refresh")}
            onClick={() => void loadStats()}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-200"
          >
            <RefreshCw size={18} className={loadingStats ? "animate-spin" : undefined} />
          </button>
        </header>

        <OfflineBanner message={t("admin.offlineBanner")} visible={!online || offline} />

        <SegmentedControl
          ariaLabel={title}
          value={range}
          onChange={setRange}
          options={RANGES.map((item) => ({
            value: item,
            label: t(`admin.statsRange.${item}`),
          }))}
        />

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous period"
            onClick={() => setDateISO(shiftDate(range, dateISO, -1))}
            className="min-h-11 min-w-11 rounded-xl bg-zinc-800 text-lg text-zinc-200"
          >
            ‹
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-medium text-zinc-200">
            {rangeSubtitle}
          </p>
          <button
            type="button"
            aria-label="Next period"
            onClick={() => setDateISO(shiftDate(range, dateISO, 1))}
            className="min-h-11 min-w-11 rounded-xl bg-zinc-800 text-lg text-zinc-200"
          >
            ›
          </button>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loadingStats && !report ? (
          <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        ) : null}

        {totals && !isEmpty ? (
          <>
            <section className="flex flex-col gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-400">{t("admin.statsCompletedHero")}</p>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <p className="font-heading text-4xl font-semibold tabular-nums text-zinc-100">
                    {totals.completed}
                    <span className="ml-1 text-lg font-medium text-zinc-400">
                      {t("admin.statsQueueUnit")}
                    </span>
                  </p>
                  {comparison ? (
                    <p
                      className={`mb-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs tabular-nums ${
                        comparison.completedDelta > 0
                          ? "border-emerald-500/50 text-emerald-400"
                          : comparison.completedDelta < 0
                            ? "border-red-500/50 text-red-400"
                            : "border-zinc-600 text-zinc-500"
                      }`}
                    >
                      {comparison.completedDelta > 0 ? "✓ +" : comparison.completedDelta < 0 ? "▼ " : "— "}
                      {t(
                        range === "week"
                          ? "admin.statsDeltaQueuesWeek"
                          : range === "month"
                            ? "admin.statsDeltaQueuesMonth"
                            : "admin.statsDeltaQueuesDay",
                      ).replace("{n}", String(Math.abs(comparison.completedDelta)))}
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-zinc-300">{peakLine()}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label={t("admin.statsRevenue")}
                  value={t("admin.statsBaht").replace(
                    "{amount}",
                    (totals.revenueBaht ?? 0).toLocaleString(locale === "th" ? "th-TH" : "en-US"),
                  )}
                  hint={t("admin.statsRevenueHint")}
                  icon={<Banknote size={14} aria-hidden />}
                />
                <StatCard
                  label={t("admin.statsUtilization")}
                  value={`${totals.utilizationPct ?? 0}%`}
                  hint={t("admin.statsUtilizationHint")}
                  icon={<Armchair size={14} aria-hidden />}
                />
                <StatCard
                  label={t("admin.statsCancelNoShowRate")}
                  value={totals.cancelNoShowRatePct != null ? `${totals.cancelNoShowRatePct}%` : "—"}
                  hint={
                    totals.cancelNoShowRatePct != null
                      ? t("admin.statsCancelHint")
                      : insufficient
                  }
                  icon={<UserX size={14} aria-hidden />}
                />
                <StatCard
                  label={t("admin.statsReturningRate")}
                  value={totals.returningRatePct != null ? `${totals.returningRatePct}%` : "—"}
                  hint={
                    totals.returningRatePct != null
                      ? t("admin.statsReturningHint")
                      : insufficient
                  }
                  icon={<RotateCcw size={14} aria-hidden />}
                />
              </div>
            </section>

            {totals.bySource ? (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <h2 className="mb-3 text-sm font-semibold text-zinc-200">{t("admin.statsBySource")}</h2>
                {(() => {
                  const rows = [
                    { label: t("admin.sourceLine"), value: totals.bySource.line, bar: "bg-sky-500" },
                    {
                      label: t("admin.sourceWalkIn"),
                      value: totals.bySource.walk_in,
                      bar: "bg-sky-600",
                    },
                    {
                      label: t("admin.sourcePhone"),
                      value: totals.bySource.phone,
                      bar: "bg-stone-500",
                    },
                    {
                      label: t("admin.sourceChat"),
                      value: totals.bySource.chat,
                      bar: "bg-stone-600",
                    },
                  ];
                  const max = Math.max(1, ...rows.map((r) => r.value));
                  return (
                    <div className="flex flex-col gap-2.5">
                      {rows.map((row) => (
                        <div key={row.label} className="flex items-center gap-2 text-sm">
                          <span className="w-16 shrink-0 text-zinc-300">{row.label}</span>
                          <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-950">
                            <div
                              className={`h-full rounded-full ${row.bar}`}
                              style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right tabular-nums text-zinc-200">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>
            ) : null}

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("admin.statsMoreSection")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  quiet
                  label={t("admin.statsWaitTime")}
                  value={
                    totals.waitMinutesAvg != null
                      ? t("admin.statsMinutesShort").replace("{n}", String(totals.waitMinutesAvg))
                      : "—"
                  }
                  hint={totals.waitMinutesAvg != null ? undefined : insufficient}
                  delta={comparison?.waitMinutesDelta}
                />
                <StatCard quiet label={t("admin.statsWalkIns")} value={totals.walkIns ?? 0} />
              </div>
            </section>

            {report?.trend.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <h2 className="mb-2 text-sm font-medium text-zinc-400">{t("admin.statsTrend")}</h2>
                <TrendBars rows={report.trend} />
              </section>
            ) : null}

            {isOperator && report?.byBarber.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <h2 className="mb-2 text-sm font-medium text-zinc-400">{t("admin.statsByBarber")}</h2>
                <p className="mb-2 text-[11px] text-zinc-500">{t("admin.statsByBarberHint")}</p>
                <BarberBars
                  rows={report.byBarber}
                  locale={locale}
                  queueUnit={t("admin.statsQueueUnit")}
                  completedMinutesLabel={t("admin.statsCompletedMinutes")}
                />
              </section>
            ) : null}

            {report?.byHour.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <h2 className="mb-2 text-sm font-medium text-zinc-400">{t("admin.statsByHour")}</h2>
                <HourlyBars
                  rows={report.byHour}
                  labels={{
                    busy: t("admin.statsBusyChair"),
                    blocked: t("admin.statsBlockedTime"),
                    free: t("admin.statsNotYet"),
                  }}
                />
              </section>
            ) : null}

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <h2 className="mb-2 text-sm font-medium text-zinc-400">{t("admin.statsBlocks")}</h2>
              <BlockTimeline
                rows={report?.blocks ?? []}
                locale={locale}
                emptyLabel={t("admin.statsNoBlocks")}
              />
            </section>
          </>
        ) : null}

        {totals && isEmpty && !loadingStats ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-zinc-200">{t("admin.statsEmptyTitle")}</p>
            <p className="text-[11px] text-zinc-400 sm:text-sm">{t("admin.statsEmptyBody")}</p>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="min-h-11 w-full max-w-xs rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {linkCopied ? t("admin.toast.copyBookingLink") : t("onboarding.copyLink")}
            </button>
          </section>
        ) : null}

        {offline && !totals ? (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {t("admin.statsOffline")}
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
