"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { ShopService } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

export default function AdminServicesPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [services, setServices] = useState<ShopService[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("200");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(shopApi("/services?includeInactive=1"), { headers: authHeaders });
      const json = (await res.json()) as { services?: ShopService[] } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.loadFailed"));
        return;
      }
      setServices(json.services ?? []);
      setError(null);
    } catch {
      setError(t("admin.networkError"));
    }
  }, [authHeaders, shopApi, t]);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    void load();
  }, [load, profile, ready]);

  async function addService() {
    const trimmed = name.trim();
    const priceBaht = Number(price);
    if (!trimmed || !Number.isFinite(priceBaht)) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/services"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: trimmed, priceBaht, isDefault: services.length === 0 }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setName("");
      setMessage(t("admin.servicesSaved"));
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function patchService(id: string, patch: { priceBaht?: number; isDefault?: boolean; isActive?: boolean }) {
    setSaving(true);
    try {
      const res = await fetch(shopApi(`/services/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setMessage(t("admin.servicesSaved"));
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !profile) {
    return (
      <section className="px-4 py-10 text-sm text-zinc-400">{t("common.loading")}</section>
    );
  }

  if (!isShopOperatorRole(profile.role)) {
    return (
      <section className="px-4 py-10">
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
      </section>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-4 py-5">
        <header>
          <Link href={shopPath("/admin/settings")} className="text-[11px] text-amber-400 underline">
            {t("common.back")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t("admin.servicesTitle")}</h1>
          <p className="mt-1 text-[11px] text-zinc-400">{t("admin.servicesHint")}</p>
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        {services.length === 0 ? (
          <p className="rounded-xl bg-zinc-900 p-4 text-sm text-zinc-400">{t("admin.servicesEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {services.map((service) => (
              <li key={service.id} className="rounded-xl bg-zinc-900 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {service.name}
                      {service.is_default ? (
                        <span className="ml-2 text-[11px] text-amber-400">{t("admin.servicesDefault")}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      ฿{service.price_baht}
                      {!service.is_active ? " · off" : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!service.is_default && service.is_active ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void patchService(service.id, { isDefault: true })}
                        className="min-h-11 rounded-lg bg-zinc-800 px-3 text-[11px] text-zinc-200"
                      >
                        {t("admin.servicesDefault")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void patchService(service.id, { isActive: !service.is_active })}
                      className="min-h-11 rounded-lg border border-zinc-700 px-3 text-[11px] text-zinc-300"
                    >
                      {service.is_active ? t("admin.deactivate") : t("admin.restoreToShop")}
                    </button>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
                  {t("admin.servicesPrice")}
                  <input
                    type="number"
                    min={0}
                    defaultValue={service.price_baht}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next) && next !== service.price_baht) {
                        void patchService(service.id, { priceBaht: next });
                      }
                    }}
                    className="min-h-11 w-28 rounded-lg bg-zinc-800 px-2 text-sm text-zinc-100"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}

        <section className="rounded-xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.servicesAdd")}</h2>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            {t("admin.servicesName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-11 rounded-lg bg-zinc-800 px-3"
            />
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            {t("admin.servicesPrice")}
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="min-h-11 rounded-lg bg-zinc-800 px-3"
            />
          </label>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void addService()}
            className="mt-3 min-h-11 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.servicesAdd")}
          </button>
        </section>
      </div>
    </AdminShell>
  );
}
