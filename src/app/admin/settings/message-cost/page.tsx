"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import {
  buildComparisonTable,
  estimateMessageCost,
  type ComparisonScenarioId,
  type LineOaPlanId,
} from "@/lib/line/message-cost-calc";

const PLAN_LABEL_KEY: Record<LineOaPlanId, MessageKey> = {
  free: "admin.messageCost.plan.free",
  basic: "admin.messageCost.plan.basic",
  pro: "admin.messageCost.plan.pro",
};

const SCENARIO_LABEL_KEY: Record<ComparisonScenarioId, MessageKey> = {
  confirm_and_reminder: "admin.messageCost.scenario.confirmAndReminder",
  reminder_only: "admin.messageCost.scenario.reminderOnly",
  confirm_only: "admin.messageCost.scenario.confirmOnly",
  all_off: "admin.messageCost.scenario.allOff",
};

function formatThb(amount: number, locale: string): string {
  if (!Number.isFinite(amount)) return "—";
  return `฿${amount.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MessageCostCalculatorPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();

  const [queues, setQueues] = useState<string>("100");
  const [confirmPush, setConfirmPush] = useState(true);
  const [reminderPush, setReminderPush] = useState(false);
  const [cancelPercent, setCancelPercent] = useState<string>("0");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(shopApi("/settings"), { headers: authHeaders });
      if (!res.ok) return;
      const s = (await res.json()) as {
        remindersEnabled?: boolean;
        bookingConfirmPushEnabled?: boolean;
      };
      setConfirmPush(s.bookingConfirmPushEnabled !== false);
      setReminderPush(Boolean(s.remindersEnabled));
    } catch {
      /* keep defaults */
    } finally {
      setSettingsLoaded(true);
    }
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (!ready || !profile) return;
    void loadSettings();
  }, [ready, profile, loadSettings]);

  const queuesNum = useMemo(() => {
    const n = Number(queues);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [queues]);

  const cancelNum = useMemo(() => {
    const n = Number(cancelPercent);
    if (!Number.isFinite(n) || n < 0) return 0;
    if (n > 100) return 100;
    return n;
  }, [cancelPercent]);

  const estimate = useMemo(
    () =>
      estimateMessageCost({
        queuesPerMonth: queuesNum,
        confirmPush,
        reminderPush,
        cancelReschedulePercent: cancelNum,
      }),
    [queuesNum, confirmPush, reminderPush, cancelNum],
  );

  const comparison = useMemo(
    () =>
      buildComparisonTable({
        queuesPerMonth: queuesNum,
        cancelReschedulePercent: cancelNum,
      }),
    [queuesNum, cancelNum],
  );

  if (!ready || !profile) {
    return <section className="px-4 py-10 text-sm text-zinc-400">{t("common.loading")}</section>;
  }

  if (!isShopOperatorRole(profile.role)) {
    return (
      <AdminShell role={profile.role}>
        <div className="flex flex-col gap-4 px-4 py-5">
          <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
          <Link href={shopPath("/admin/settings")} className="text-amber-400">
            {t("common.back")}
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-4 py-5">
        <Link href={shopPath("/admin/settings/reminders")} className="text-sm text-zinc-400">
          ← {t("admin.remindersTitle")}
        </Link>
        <h1 className="text-xl font-semibold">{t("admin.messageCost.title")}</h1>
        <p className="text-sm leading-relaxed text-zinc-400">{t("admin.messageCost.intro")}</p>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <label className="block">
            <span className="text-sm font-semibold">{t("admin.messageCost.queues")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={queues}
              onChange={(e) => setQueues(e.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl bg-zinc-800 px-3 text-base tabular-nums outline-none ring-amber-400 focus:ring-2"
            />
          </label>

          <div className="mt-4 space-y-3">
            <label className="flex min-h-11 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-amber-400"
                checked={confirmPush}
                disabled={!settingsLoaded}
                onChange={(e) => setConfirmPush(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium">{t("admin.messageCost.confirm")}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {t("admin.messageCost.confirmHint")}
                </span>
              </span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-amber-400"
                checked={reminderPush}
                disabled={!settingsLoaded}
                onChange={(e) => setReminderPush(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium">{t("admin.messageCost.reminder")}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {t("admin.messageCost.reminderHint")}
                </span>
              </span>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold">{t("admin.messageCost.cancelShare")}</span>
            <p className="mt-1 text-xs text-zinc-500">{t("admin.messageCost.cancelShareHint")}</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={1}
                value={cancelPercent}
                onChange={(e) => setCancelPercent(e.target.value)}
                className="min-h-12 w-28 rounded-xl bg-zinc-800 px-3 text-base tabular-nums outline-none ring-amber-400 focus:ring-2"
              />
              <span className="text-sm text-zinc-400">%</span>
            </div>
          </label>
        </section>

        <section className="rounded-2xl border border-amber-500/30 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-400/90">
            {t("admin.messageCost.resultLabel")}
          </p>
          <dl className="mt-3 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-zinc-400">{t("admin.messageCost.msgsMonth")}</dt>
              <dd className="text-base font-semibold tabular-nums">
                {estimate.monthlyMessages.toLocaleString(locale === "th" ? "th-TH" : "en-US")}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-zinc-400">{t("admin.messageCost.package")}</dt>
              <dd className="text-base font-semibold">
                {t(PLAN_LABEL_KEY[estimate.recommended.planId])}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-zinc-400">{t("admin.messageCost.costMonth")}</dt>
              <dd className="text-lg font-semibold tabular-nums text-amber-300">
                {formatThb(estimate.recommended.monthlyCostThb, locale)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-zinc-400">{t("admin.messageCost.costQueue")}</dt>
              <dd className="text-base font-semibold tabular-nums">
                {estimate.costPerQueueThb == null
                  ? "—"
                  : formatThb(estimate.costPerQueueThb, locale)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {t("admin.messageCost.perQueueFormula")}
          </p>
        </section>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.messageCost.compareTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.messageCost.compareHint")}</p>
          <div className="mt-3 -mx-1 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-xs text-zinc-500">
                  <th className="px-1 py-2 font-medium">{t("admin.messageCost.col.scenario")}</th>
                  <th className="px-1 py-2 font-medium tabular-nums">
                    {t("admin.messageCost.col.msgs")}
                  </th>
                  <th className="px-1 py-2 font-medium">{t("admin.messageCost.col.plan")}</th>
                  <th className="px-1 py-2 font-medium tabular-nums">
                    {t("admin.messageCost.col.month")}
                  </th>
                  <th className="px-1 py-2 font-medium tabular-nums">
                    {t("admin.messageCost.col.queue")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.scenarioId} className="border-b border-zinc-800/80">
                    <td className="px-1 py-2.5 align-top text-zinc-200">
                      <span className="block">{t(SCENARIO_LABEL_KEY[row.scenarioId])}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {row.messagesPerQueue} {t("admin.messageCost.msgPerQueue")}
                      </span>
                    </td>
                    <td className="px-1 py-2.5 align-top tabular-nums text-zinc-200">
                      {row.monthlyMessages.toLocaleString(locale === "th" ? "th-TH" : "en-US")}
                    </td>
                    <td className="px-1 py-2.5 align-top text-zinc-200">
                      {t(PLAN_LABEL_KEY[row.planId])}
                    </td>
                    <td className="px-1 py-2.5 align-top tabular-nums text-zinc-200">
                      {formatThb(row.monthlyCostThb, locale)}
                    </td>
                    <td className="px-1 py-2.5 align-top tabular-nums text-zinc-200">
                      {row.costPerQueueThb == null ? "—" : formatThb(row.costPerQueueThb, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-zinc-900/80 p-4 text-sm leading-relaxed text-zinc-400">
          <p>{t("admin.messageCost.friendly")}</p>
          <p className="mt-3">{t("admin.messageCost.billingNote")}</p>
          <p className="mt-3 text-xs text-zinc-500">{t("admin.messageCost.priceAsOf")}</p>
        </section>
      </div>
    </AdminShell>
  );
}
