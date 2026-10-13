"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { BarberWebpushScope } from "@/lib/webpush/subscriptions";

export default function BarberScopePage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [scope, setScope] = useState<BarberWebpushScope>("own");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(shopApi("/webpush/barber-scope"), { headers: authHeaders });
    if (!res.ok) return;
    const json = (await res.json()) as { scope?: BarberWebpushScope };
    setScope(json.scope === "all" ? "all" : "own");
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (ready && profile && isShopOperatorRole(profile.role)) void load();
  }, [ready, profile, load]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/webpush/barber-scope"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ scope }),
      });
      if (!res.ok) throw new Error("fail");
      setMessage(t("admin.saved"));
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setSaving(false);
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

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <header>
          <Link
            href={shopPath("/admin/settings/notifications")}
            className="text-sm text-zinc-400"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t("webpush.barberScopeTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("webpush.barberScopeSubtitle")}</p>
        </header>

        <p className="text-sm text-zinc-300">{t("webpush.barberScopeQuestion")}</p>

        <OptionCard
          selected={scope === "own"}
          title={t("webpush.scopeOwn")}
          body={t("webpush.scopeOwnBody")}
          badge={t("webpush.defaultBadge")}
          onSelect={() => setScope("own")}
        />
        <OptionCard
          selected={scope === "all"}
          title={t("webpush.scopeAll")}
          body={t("webpush.scopeAllBody")}
          onSelect={() => setScope("all")}
        />

        <section className="rounded-2xl bg-zinc-900/80 p-4 text-sm">
          <p className="font-semibold text-amber-400">{t("webpush.whoGetsWhat")}</p>
          <div className="mt-2 flex justify-between text-zinc-300">
            <span>{t("webpush.ownersManagers")}</span>
            <span>{t("webpush.alwaysAll")}</span>
          </div>
          <div className="mt-1 flex justify-between text-zinc-300">
            <span>{t("admin.roleBarber")}</span>
            <span>{scope === "all" ? t("webpush.scopeAll") : t("webpush.scopeOwn")}</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">{t("webpush.barberScopeFooter")}</p>
        </section>

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>
    </AdminShell>
  );
}

function OptionCard({
  selected,
  title,
  body,
  badge,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left ${
        selected ? "border-amber-400 bg-zinc-900" : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
            selected ? "border-amber-400 bg-amber-400" : "border-zinc-500"
          }`}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-zinc-950" /> : null}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-zinc-50">{title}</p>
            {badge ? (
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-400">{body}</p>
        </div>
      </div>
    </button>
  );
}
