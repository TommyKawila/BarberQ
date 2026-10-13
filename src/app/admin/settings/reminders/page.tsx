"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { REMINDER_LEAD_PRESETS_MINUTES } from "@/lib/reminders/presets";
import { reminderLeadAdminKey } from "@/lib/reminders/labels";
import type { ShopPushQuota } from "@/lib/line/quota";
import { marketingOffer } from "@/lib/marketing/offer";

export default function ReminderSettingsPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [enabled, setEnabled] = useState(false);
  const [lead, setLead] = useState(120);
  const [quota, setQuota] = useState<ShopPushQuota | null>(null);
  const [showEnableNotice, setShowEnableNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [runBusy, setRunBusy] = useState(false);
  const [showManualRun, setShowManualRun] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [settingsRes, quotaRes, runMetaRes] = await Promise.all([
        fetch(shopApi("/settings"), { headers: authHeaders }),
        fetch(shopApi("/line-quota"), { headers: authHeaders }),
        fetch(shopApi("/reminders/run-due"), { headers: authHeaders }),
      ]);
      if (settingsRes.ok) {
        const s = (await settingsRes.json()) as {
          remindersEnabled?: boolean;
          reminderLeadMinutes?: number;
        };
        setEnabled(Boolean(s.remindersEnabled));
        setLead(
          typeof s.reminderLeadMinutes === "number" ? s.reminderLeadMinutes : 120,
        );
      }
      if (quotaRes.ok) {
        const q = (await quotaRes.json()) as { quota: ShopPushQuota };
        setQuota(q.quota);
      }
      if (runMetaRes.ok) {
        const meta = (await runMetaRes.json()) as { allowed?: boolean };
        setShowManualRun(Boolean(meta.allowed));
      }
    } catch {
      /* ignore */
    }
  }, [authHeaders, shopApi]);

  async function runDueNow() {
    setRunBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/reminders/run-due"), {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        scanned?: number;
        sent?: number;
        skipped?: number;
        quotaSkipped?: number;
        errors?: number;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.reminderRunFailed"));
        return;
      }
      setMessage(
        t("admin.reminderRunResult")
          .replace("{scanned}", String(json.scanned ?? 0))
          .replace("{sent}", String(json.sent ?? 0))
          .replace("{skipped}", String(json.skipped ?? 0))
          .replace("{quota}", String(json.quotaSkipped ?? 0)),
      );
    } catch {
      setError(t("admin.reminderRunFailed"));
    } finally {
      setRunBusy(false);
    }
  }

  useEffect(() => {
    if (!ready || !profile) return;
    void load();
  }, [ready, profile, load]);

  async function save(next: { remindersEnabled?: boolean; reminderLeadMinutes?: number }) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        setError(t("admin.reminderSaveFailed"));
        return;
      }
      const json = (await res.json()) as {
        remindersEnabled?: boolean;
        reminderLeadMinutes?: number;
      };
      setEnabled(Boolean(json.remindersEnabled));
      if (typeof json.reminderLeadMinutes === "number") {
        setLead(json.reminderLeadMinutes);
      }
      setMessage(t("admin.reminderSaved"));
    } catch {
      setError(t("admin.reminderSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  function onToggle(checked: boolean) {
    if (checked) {
      setShowEnableNotice(true);
      return;
    }
    setShowEnableNotice(false);
    void save({ remindersEnabled: false });
  }

  function confirmEnable() {
    setShowEnableNotice(false);
    void save({ remindersEnabled: true, reminderLeadMinutes: lead });
  }

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

  const used = quota?.used ?? 0;
  const budget = quota?.budget ?? marketingOffer.lineFreePushQuota;
  const quotaFull = quota?.level === "full";

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-4 py-5">
        <Link href={shopPath("/admin/settings")} className="text-sm text-zinc-400">
          ← {t("admin.settings")}
        </Link>
        <h1 className="text-xl font-semibold">{t("admin.remindersTitle")}</h1>

        {quotaFull ? (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-200">{t("admin.reminderQuotaBannerTitle")}</p>
            <p className="mt-1 text-sm text-red-100/90">{t("admin.reminderQuotaBannerBody")}</p>
            <Link
              href={shopPath("/admin/settings/line/quota")}
              className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950"
            >
              {t("lineConnect.viewQuota")}
            </Link>
          </div>
        ) : null}

        <section className="rounded-2xl bg-zinc-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{t("admin.remindersToggle")}</h2>
              <p className="mt-1 text-sm text-zinc-400">{t("admin.remindersToggleHint")}</p>
              <p className="mt-2 text-xs tabular-nums text-zinc-500">
                {t("admin.reminderUsage")
                  .replace("{used}", String(used))
                  .replace("{budget}", String(budget))}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={enabled}
                disabled={busy}
                onChange={(e) => onToggle(e.target.checked)}
              />
              <span className="h-7 w-12 rounded-full bg-zinc-700 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:bg-amber-400 peer-checked:after:translate-x-5" />
            </label>
          </div>
        </section>

        {showEnableNotice ? (
          <div
            role="alertdialog"
            className="rounded-2xl border-2 border-amber-400 bg-amber-400/15 p-4 ring-2 ring-amber-400/40"
          >
            <p className="text-base font-bold text-amber-100">{t("admin.reminderEnableNoticeTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-50/95">
              {t("admin.reminderEnableNoticeBody").replace(
                "{quota}",
                String(marketingOffer.lineFreePushQuota),
              )}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => confirmEnable()}
                className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
              >
                {t("admin.reminderEnableConfirm")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowEnableNotice(false)}
                className="min-h-11 rounded-xl border border-zinc-600 text-sm text-zinc-200"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.reminderDefaultLead")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.reminderDefaultLeadHint")}</p>
          <select
            value={lead}
            disabled={busy}
            onChange={(e) => {
              const next = Number(e.target.value);
              setLead(next);
              void save({ reminderLeadMinutes: next });
            }}
            className="mt-3 min-h-12 w-full rounded-xl bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
          >
            {REMINDER_LEAD_PRESETS_MINUTES.map((mins) => (
              <option key={mins} value={mins}>
                {t(reminderLeadAdminKey(mins) as MessageKey)}
              </option>
            ))}
          </select>
        </section>

        {showManualRun && profile.role === "owner" ? (
          <section className="rounded-2xl border border-dashed border-zinc-600 bg-zinc-900/80 p-4">
            <h2 className="text-sm font-semibold">{t("admin.reminderRunTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("admin.reminderRunHint")}</p>
            <button
              type="button"
              disabled={runBusy || busy}
              onClick={() => void runDueNow()}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-500/50 font-semibold text-amber-200 disabled:opacity-50"
            >
              {runBusy ? t("common.loading") : t("admin.reminderRunNow")}
            </button>
          </section>
        ) : null}

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </AdminShell>
  );
}
