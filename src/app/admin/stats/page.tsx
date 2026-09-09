"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { BarberBars } from "@/components/admin/charts/BarberBars";
import { BlockTimeline } from "@/components/admin/charts/BlockTimeline";
import { HourlyBars } from "@/components/admin/charts/HourlyBars";
import { StackedRatioBar } from "@/components/admin/charts/StackedRatioBar";
import { StatCard } from "@/components/admin/charts/StatCard";
import { TrendBars } from "@/components/admin/charts/TrendBars";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant } from "@/lib/services/slot-service";
import type { StatsRange, StatsReport } from "@/lib/services/stats-service";

interface ApiError {
  error?: { code?: string; message?: string };
}

const RANGES: StatsRange[] = ["day", "week", "month"];

export default function AdminStatsPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi } = useShopSlug();

  const [range, setRange] = useState<StatsRange>("day");
  const [dateISO] = useState(() => dateISOFromInstant(new Date()));
  const [report, setReport] = useState<StatsReport | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }
      setError(null);
      setReport(json);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLoadingStats(false);
    }
  }, [authHeaders, dateISO, range, shopApi, t]);

  useEffect(() => {
    if (!ready || !profile) return;
    void loadStats();
  }, [loadStats, profile, ready]);

  if (!ready || !profile) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  const totals = report?.totals;
  const pending =
    (totals?.booked ?? 0) -
    (totals?.completed ?? 0) -
    (totals?.cancelled ?? 0) -
    (totals?.noShow ?? 0);
  const isOwner = profile.role === "owner";

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-3 py-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            {mockMode ? (
              <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                {t("common.prototypeMode")}
              </span>
            ) : null}
            <h1 className="text-xl font-semibold">{t("admin.stats")}</h1>
            <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-zinc-500">{report?.range.label ?? dateISO}</p>
            <button
              type="button"
              onClick={() => void loadStats()}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
            >
              {t("admin.refresh")}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`min-h-11 rounded-xl text-sm font-medium ${
                range === item ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {t(`admin.statsRange.${item}`)}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loadingStats && !report ? (
          <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        ) : null}

        {totals ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label={t("admin.statsCustomers")} value={totals.uniqueCustomers} accent="sky" />
              <StatCard label={t("admin.statsBooked")} value={totals.booked} accent="emerald" />
              <StatCard label={t("admin.statsCancelled")} value={totals.cancelled} accent="red" />
              <StatCard label={t("admin.statsCompleted")} value={totals.completed} accent="amber" />
            </div>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <h2 className="mb-2 text-sm font-semibold">{t("admin.statsUtilization")}</h2>
              <p className="text-2xl font-semibold tabular-nums">{totals.utilizationPct}%</p>
              <p className="mt-1 text-xs text-zinc-500">
                {t("admin.statsWalkIns")}: {totals.walkIns} · {t("admin.statsNewCustomers")}: {totals.newCustomers} · {t("admin.noShow")}: {totals.noShow}
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <h2 className="mb-2 text-sm font-semibold">{t("admin.statsOutcomes")}</h2>
              <StackedRatioBar
                completed={totals.completed}
                cancelled={totals.cancelled}
                noShow={totals.noShow}
                pending={Math.max(0, pending)}
                labels={{
                  completed: t("admin.completed"),
                  cancelled: t("admin.statsCancelled"),
                  noShow: t("admin.noShow"),
                  pending: t("admin.statsPending"),
                }}
              />
            </section>

            {report?.byHour.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <h2 className="mb-2 text-sm font-semibold">{t("admin.statsByHour")}</h2>
                <HourlyBars
                  rows={report.byHour}
                  labels={{
                    booked: t("admin.booked"),
                    walkIn: t("admin.walkIn"),
                    free: t("admin.free"),
                  }}
                />
              </section>
            ) : null}

            {isOwner && report?.byBarber.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <h2 className="mb-2 text-sm font-semibold">{t("admin.statsByBarber")}</h2>
                <BarberBars
                  rows={report.byBarber}
                  locale={locale}
                  minuteLabel={t("common.minutes")}
                />
              </section>
            ) : null}

            {report?.trend.length ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <h2 className="mb-2 text-sm font-semibold">{t("admin.statsTrend")}</h2>
                <TrendBars rows={report.trend} />
              </section>
            ) : null}

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <h2 className="mb-2 text-sm font-semibold">{t("admin.statsBlocks")}</h2>
              <BlockTimeline
                rows={report?.blocks ?? []}
                locale={locale}
                emptyLabel={t("admin.statsNoBlocks")}
              />
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
