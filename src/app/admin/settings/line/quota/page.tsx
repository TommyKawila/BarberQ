"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { ShopPushQuota } from "@/lib/line/quota";

export default function LineQuotaPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [quota, setQuota] = useState<ShopPushQuota | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(shopApi("/line-quota"), { headers: authHeaders });
      if (!res.ok) throw new Error("fail");
      const json = (await res.json()) as { quota: ShopPushQuota };
      setQuota(json.quota);
      if (json.quota.level === "full") setShowUpgrade(true);
    } catch {
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (ready && profile && isShopOperatorRole(profile.role)) void load();
  }, [ready, profile, load]);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(shopApi("/line-quota"), {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const json = (await res.json()) as { quota: ShopPushQuota };
        setQuota(json.quota);
      }
    } finally {
      setRefreshing(false);
    }
  }

  if (!ready || !profile) {
    return <section className="px-4 py-10 text-sm text-zinc-400">{t("common.loading")}</section>;
  }
  if (!isShopOperatorRole(profile.role)) {
    return (
      <section className="px-4 py-10 text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</section>
    );
  }

  if (showUpgrade && quota?.level === "full") {
    return (
      <AdminShell role={profile.role}>
        <div className="flex flex-col gap-5 px-4 py-5">
          <Link href={shopPath("/admin/settings/line")} className="text-sm text-zinc-400">
            ← {t("common.back")}
          </Link>
          <h1 className="text-xl font-semibold">{t("lineQuota.upgradeTitle")}</h1>
          <p className="text-sm text-zinc-400">{t("lineQuota.upgradeSubtitle")}</p>
          <section className="rounded-2xl border border-emerald-500/40 bg-zinc-900 p-4">
            <p className="font-semibold text-zinc-50">{t("lineQuota.bookingStillWorks")}</p>
            <p className="mt-2 text-sm text-zinc-300">{t("lineQuota.bookingStillWorksBody")}</p>
            <p className="mt-3 text-sm text-amber-400">{t("lineQuota.callCustomerTip")}</p>
          </section>
          <section className="rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-300">
            <ol className="list-decimal space-y-2 pl-4">
              <li>{t("lineQuota.upgradeStep1")}</li>
              <li>{t("lineQuota.upgradeStep2")}</li>
              <li>{t("lineQuota.upgradeStep3")}</li>
              <li>{t("lineQuota.upgradeStep4")}</li>
            </ol>
            <p className="mt-4 text-xs text-zinc-500">{t("lineQuota.pricingNote")}</p>
          </section>
          <a
            href="https://manager.line.biz/"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950"
          >
            {t("lineQuota.openManager")}
          </a>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => void refresh()}
            className="min-h-12 rounded-xl border border-zinc-700 font-semibold disabled:opacity-50"
          >
            {t("lineQuota.checkAgain")}
          </button>
          <button
            type="button"
            onClick={() => setShowUpgrade(false)}
            className="text-sm text-zinc-400"
          >
            {t("common.back")}
          </button>
        </div>
      </AdminShell>
    );
  }

  const level = quota?.level ?? "ok";
  const barColor =
    level === "full" ? "bg-orange-500" : level === "warn" ? "bg-amber-400" : "bg-emerald-500";
  const badge =
    level === "full"
      ? t("lineQuota.badgeFull")
      : level === "warn"
        ? t("lineQuota.badgeWarn")
        : t("lineQuota.badgeOk");
  const badgeClass =
    level === "full"
      ? "bg-orange-500/20 text-orange-300"
      : level === "warn"
        ? "bg-amber-400/20 text-amber-300"
        : "bg-emerald-500/20 text-emerald-300";

  const resetLabel = quota
    ? new Date(quota.resetAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
        day: "numeric",
        month: "short",
      })
    : "—";

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <header>
          <Link href={shopPath("/admin/settings/line")} className="text-sm text-zinc-400">
            ← {t("common.back")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t("lineQuota.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("lineQuota.subtitle")}</p>
        </header>

        {loading || !quota ? (
          <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        ) : (
          <section
            className={`rounded-2xl border bg-zinc-900 p-4 ${
              level === "full"
                ? "border-orange-500/50"
                : level === "warn"
                  ? "border-amber-400/50"
                  : "border-emerald-500/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-3xl font-semibold tabular-nums">
                {quota.used} / {quota.budget}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                {badge}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full ${barColor}`}
                style={{ width: `${Math.min(100, quota.percent)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              {level === "ok"
                ? t("lineQuota.footerOk")
                    .replace("{remaining}", String(quota.remaining))
                    .replace("{reset}", resetLabel)
                : level === "warn"
                  ? t("lineQuota.footerWarn")
                  : t("lineQuota.footerFull")}
            </p>
            {level !== "ok" ? (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="mt-3 text-sm font-medium text-amber-400"
              >
                {t("lineQuota.howToUpgrade")} →
              </button>
            ) : null}
          </section>
        )}

        <p className="text-xs text-zinc-500">{t("lineQuota.replyNote")}</p>
        <button
          type="button"
          disabled={refreshing}
          onClick={() => void refresh()}
          className="min-h-11 rounded-xl border border-zinc-700 text-sm disabled:opacity-50"
        >
          {t("lineQuota.checkAgain")}
        </button>
      </div>
    </AdminShell>
  );
}
