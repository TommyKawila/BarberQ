"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { barberLabel, type Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string; count?: number };
}

type ConfirmAction = { type: "remove"; barber: Barber } | { type: "unlink"; barber: Barber };

export default function AdminStaffPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath, shopSlug } = useShopSlug();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadBarbers = useCallback(async () => {
    setLoadingBarbers(true);
    try {
      const res = await fetch(shopApi("/barbers"), { headers: authHeaders });
      const json = (await res.json()) as { barbers?: Barber[] } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.loadFailed"));
        return;
      }
      setError(null);
      setBarbers(json.barbers ?? []);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLoadingBarbers(false);
    }
  }, [authHeaders, shopApi, t]);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    void loadBarbers();
  }, [loadBarbers, profile, ready]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setLineId("");
    setSlotDuration(30);
    setFormMessage(null);
  }

  function startEdit(barber: Barber) {
    setEditingId(barber.id);
    setName(barber.name);
    setLineId(barber.line_id ?? "");
    setSlotDuration(barber.slot_duration_minutes);
    setShowForm(true);
    setFormMessage(null);
  }

  async function saveBarber() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setFormMessage(null);
    setError(null);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
      const res = editingId
        ? await fetch(`/api/barbers/${editingId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              name: trimmed,
              lineId: lineId.trim() || null,
              slotDuration,
            }),
          })
        : await fetch(shopApi("/barbers"), {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: trimmed,
              lineId: lineId.trim() || null,
              slotDuration,
            }),
          });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setFormMessage(editingId ? t("admin.barberSaved") : t("admin.barberCreated"));
      resetForm();
      await loadBarbers();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBookable(barber: Barber) {
    setError(null);
    const res = await fetch(`/api/barbers/${barber.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ isBookable: barber.is_bookable === false }),
    });
    const json = (await res.json()) as ApiError;
    if (!res.ok) {
      setError(json.error?.message ?? t("admin.updateFailed"));
      return;
    }
    await loadBarbers();
  }

  async function copyBookingLink() {
    const url = `${window.location.origin}/${shopSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function unlinkLine(barber: Barber) {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ lineId: null }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setConfirmAction(null);
      setOpenMenuId(null);
      await loadBarbers();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setActionBusy(false);
    }
  }

  async function removeFromShop(barber: Barber) {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barber.id}/deactivate`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        if (json.error?.code === "HAS_FUTURE_BOOKINGS") {
          const label = barberLabel(barber.name, locale);
          setError(
            t("admin.removeFromShopFutureBookings")
              .replace("{name}", label)
              .replace("{count}", String(json.error.count ?? 0)),
          );
        } else {
          setError(json.error?.message ?? t("admin.updateFailed"));
        }
        return;
      }
      setConfirmAction(null);
      setOpenMenuId(null);
      await loadBarbers();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setActionBusy(false);
    }
  }

  async function restoreToShop(barber: Barber) {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barber.id}/reactivate`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadBarbers();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === "unlink") {
      await unlinkLine(confirmAction.barber);
      return;
    }
    await removeFromShop(confirmAction.barber);
  }

  const activeBarbers = barbers.filter((b) => b.is_active !== false);
  const removedBarbers = barbers.filter((b) => b.is_active === false);
  const bookableBarbers = activeBarbers.filter((b) => b.is_bookable !== false);

  if (!ready || !profile) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (profile.role !== "owner") {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.staffManagement")}</h1>
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
        <Link href={shopPath("/admin")} className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <header>
          {mockMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <h1 className="text-xl font-semibold">{t("admin.staffManagement")}</h1>
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loadingBarbers ? <p className="text-sm text-zinc-400">{t("common.loading")}</p> : null}

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="min-h-11 rounded-xl bg-amber-400 font-semibold text-zinc-950"
          >
            {t("admin.addBarber")}
          </button>
        ) : (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="text-sm font-semibold">
              {editingId ? t("admin.editBarber") : t("admin.addBarber")}
            </h2>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.barberName")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.barberLineHint")}
              <input
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.slotDuration")}
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="min-h-11 rounded-lg bg-zinc-800 px-3"
              >
                {ALLOWED_SLOT_DURATIONS.map((m) => (
                  <option key={m} value={m}>{m} {t("common.minutes")}</option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={saving || !name.trim()}
                onClick={() => void saveBarber()}
                className="min-h-11 flex-1 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
              >
                {t("admin.saveBarber")}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300"
              >
                {t("booking.cancel")}
              </button>
            </div>
            {formMessage ? <p className="mt-2 text-sm text-emerald-400">{formMessage}</p> : null}
          </section>
        )}

        {confirmAction ? (
          <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
            <h2 className="font-semibold">
              {confirmAction.type === "remove"
                ? t("admin.removeFromShopTitle").replace(
                    "{name}",
                    barberLabel(confirmAction.barber.name, locale),
                  )
                : t("admin.unlinkLineConfirm")}
            </h2>
            {confirmAction.type === "remove" ? (
              <>
                <p className="mt-2 text-sm text-zinc-400">
                  {t("admin.removeFromShopBody").replace(
                    "{name}",
                    barberLabel(confirmAction.barber.name, locale),
                  )}
                </p>
                {confirmAction.barber.line_id ? (
                  <p className="mt-2 text-sm text-zinc-500">{t("admin.removeFromShopLineHint")}</p>
                ) : null}
              </>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleConfirm()}
                className="min-h-10 rounded-lg bg-red-600/90 px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {confirmAction.type === "remove"
                  ? t("admin.removeFromShop")
                  : t("admin.unlinkLine")}
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setConfirmAction(null)}
                className="min-h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300"
              >
                {t("booking.cancel")}
              </button>
            </div>
          </section>
        ) : null}

        {bookableBarbers.length === 0 && !loadingBarbers && !showForm && activeBarbers.length === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-10 text-center">
            <p className="text-sm text-zinc-400">{t("admin.teamEmpty")}</p>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
            >
              {copied ? t("admin.bookingLinkCopied") : t("admin.copyBookingLink")}
            </button>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            {activeBarbers.map((barber) => (
              <div key={barber.id} className="rounded-2xl bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{barberLabel(barber.name, locale)}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {barber.role === "owner" ? t("admin.roleOwner") : t("admin.roleBarber")}
                      · {barber.slot_duration_minutes} {t("common.minutes")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {barber.line_id ? t("admin.barberLineLinked") : t("admin.barberLineNotLinked")}
                      · {barber.is_bookable !== false ? t("admin.barberBookable") : t("admin.barberNotBookable")}
                    </p>
                  </div>
                  {barber.role !== "owner" ? (
                    <details
                      className="relative"
                      open={openMenuId === barber.id}
                      onToggle={(e) => {
                        const open = (e.currentTarget as HTMLDetailsElement).open;
                        setOpenMenuId(open ? barber.id : null);
                      }}
                    >
                      <summary className="cursor-pointer list-none rounded-lg bg-zinc-800 px-2 py-1 text-sm text-zinc-300">
                        ⋯
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 min-w-[11rem] rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-lg">
                        {barber.line_id ? (
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: "unlink", barber })}
                            className="block w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                          >
                            {t("admin.unlinkLine")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: "remove", barber })}
                          className="block w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-zinc-800"
                        >
                          {t("admin.removeFromShop")}
                        </button>
                      </div>
                    </details>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(barber)}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  >
                    {t("admin.editBarber")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleBookable(barber)}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  >
                    {t("admin.toggleBookable")}
                  </button>
                  <Link
                    href={shopPath(`/admin/my-schedule?barber=${barber.id}`)}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  >
                    {t("admin.nav.schedule")}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

        {removedBarbers.length > 0 ? (
          <details className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-400">
              {t("admin.removedBarbersTitle")} ({removedBarbers.length})
            </summary>
            <div className="flex flex-col gap-2 px-4 pb-4">
              {removedBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-zinc-900 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{barberLabel(barber.name, locale)}</p>
                    <p className="text-xs text-zinc-500">{t("admin.removedBarberStatus")}</p>
                  </div>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void restoreToShop(barber)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 disabled:opacity-50"
                  >
                    {t("admin.restoreToShop")}
                  </button>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </AdminShell>
  );
}
