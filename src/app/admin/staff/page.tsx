"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AddBarberSheet } from "@/components/admin/AddBarberSheet";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { StaffActionsSheet } from "@/components/admin/StaffActionsSheet";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { useToast } from "@/components/ui/ToastProvider";
import { shortBookingUrl } from "@/lib/admin/short-url";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import {
  applyOptimisticBookable,
  canToggleBookable,
  getQueueStatusHintKey,
  getQueueStatusLabelKey,
  isBarberBookable,
  rollbackOptimisticBookable,
  shouldShowRemoveMenu,
  updateBarberBookableInList,
} from "@/lib/barber/optimistic-bookable";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useI18n } from "@/lib/i18n/locale-provider";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant } from "@/lib/services/slot-service";
import { barberLabel, type AdminColumn, type Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string; count?: number };
}

type ConfirmAction = { type: "remove"; barber: Barber } | { type: "unlink"; barber: Barber };

export default function AdminStaffPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath, shopSlug } = useShopSlug();
  const toast = useToast();
  const online = useOnlineStatus();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bookingUrl = buildShopLiffUrl(shopSlug) || buildShopWebUrl(shopSlug);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [menuBarber, setMenuBarber] = useState<Barber | null>(null);
  const [pendingBookableIds, setPendingBookableIds] = useState<string[]>([]);
  const [bookableErrors, setBookableErrors] = useState<Record<string, string>>({});
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});

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

  const loadTodayCounts = useCallback(async () => {
    try {
      const date = dateISOFromInstant(new Date());
      const res = await fetch(shopApi(`/block?date=${encodeURIComponent(date)}&includeClosed=1`), {
        headers: authHeaders,
      });
      const json = (await res.json()) as { columns?: AdminColumn[] };
      if (!res.ok) return;
      const counts: Record<string, number> = {};
      for (const col of json.columns ?? []) {
        if (!col?.barber?.id) continue;
        const slots = Array.isArray(col.slots) ? col.slots : [];
        counts[col.barber.id] = slots.filter((s) => s.kind === "booked").length;
      }
      setTodayCounts(counts);
    } catch {
      // non-blocking
    }
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    void loadBarbers();
    void loadTodayCounts();
  }, [loadBarbers, loadTodayCounts, profile, ready]);

  function resetForm() {
    setShowForm(false);
    setName("");
    setLineId("");
    setSlotDuration(30);
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
      const res = await fetch(shopApi("/barbers"), {
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
      setFormMessage(t("admin.barberCreated"));
      resetForm();
      await loadBarbers();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBookable(barber: Barber) {
    const pending = pendingBookableIds.includes(barber.id);
    if (!canToggleBookable(pending)) return;

    const previous = isBarberBookable(barber);
    const next = applyOptimisticBookable(previous);

    setBarbers((current) => updateBarberBookableInList(current, barber.id, next));
    setPendingBookableIds((current) => [...current, barber.id]);
    setBookableErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[barber.id];
      return nextErrors;
    });

    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ isBookable: next }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        throw new Error(json.error?.message ?? t("admin.saveBookableFailed"));
      }
    } catch {
      setBarbers((current) =>
        updateBarberBookableInList(current, barber.id, rollbackOptimisticBookable(previous)),
      );
      setBookableErrors((current) => ({
        ...current,
        [barber.id]: t("admin.saveBookableFailed"),
      }));
    } finally {
      setPendingBookableIds((current) => current.filter((id) => id !== barber.id));
    }
  }

  async function copyBookingLink() {
    const url = bookingUrl || `${window.location.origin}/${shopSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("admin.toast.copyBookingLink"));
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
      setMenuBarber(null);
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
      setMenuBarber(null);
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

  if (!isShopOperatorRole(profile.role)) {
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
          <h1 className="font-heading text-xl font-semibold">{t("admin.staffManagement")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.teamOnlineBooking")}</p>
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
        </header>

        <OfflineBanner message={t("admin.offlineBanner")} visible={!online} />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-400">{t("admin.bookingLinkShortLabel")}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm text-zinc-200">
              {shortBookingUrl(bookingUrl || `/${shopSlug}`)}
            </p>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="min-h-11 shrink-0 rounded-xl border border-zinc-600 px-3 text-sm text-zinc-100"
            >
              {copied ? t("admin.bookingLinkCopied") : t("admin.copyBookingLink")}
            </button>
          </div>
        </section>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loadingBarbers ? <p className="text-sm text-zinc-400">{t("common.loading")}</p> : null}

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="min-h-11 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
        >
          {t("admin.addBarberSheet")}
        </button>
        <AddBarberSheet
          open={showForm}
          name={name}
          lineId={lineId}
          slotDuration={slotDuration}
          saving={saving}
          formMessage={formMessage}
          onClose={resetForm}
          onChangeName={setName}
          onChangeLineId={setLineId}
          onChangeSlotDuration={setSlotDuration}
          onSave={() => void saveBarber()}
        />

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
                {t("common.cancel")}
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
            {activeBarbers.map((barber) => {
              const displayName = barberLabel(barber.name, locale);
              const bookable = isBarberBookable(barber);
              const isPending = pendingBookableIds.includes(barber.id);
              const statusLabelKey = getQueueStatusLabelKey(bookable);
              const statusHintKey = getQueueStatusHintKey(bookable);
              const cardError = bookableErrors[barber.id];

              return (
                <div key={barber.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-heading text-sm font-semibold text-zinc-200"
                          aria-hidden
                        >
                          {(displayName.trim()[0] || "?").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading font-semibold">
                            {displayName}{" "}
                            <span className="text-sm font-normal text-zinc-400">
                              {barber.role === "owner" ? t("admin.roleOwner") : t("admin.roleBarber")}
                            </span>
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {bookable ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 px-2 py-0.5 text-xs text-emerald-300">
                                ✓ {t(statusLabelKey)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300">
                                ⛔ {t(statusLabelKey)}
                              </span>
                            )}
                            {barber.line_id ? (
                              <span className="inline-flex items-center rounded-full bg-sky-700 px-2 py-0.5 text-xs text-white">
                                {t("admin.barberLineLinked")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-400 px-2 py-0.5 text-xs font-medium text-zinc-950">
                                ⚠ {t("admin.barberLineNotLinked")}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-zinc-500">
                            {t("admin.teamTodayBookings").replace(
                              "{n}",
                              String(todayCounts[barber.id] ?? 0),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {shouldShowRemoveMenu(barber.role) ? (
                      <button
                        type="button"
                        aria-label={t("admin.nav.more")}
                        onClick={() => setMenuBarber(barber)}
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-transparent text-lg text-zinc-300"
                      >
                        ⋯
                      </button>
                    ) : null}
                  </div>

                  <div className="my-4 border-t border-zinc-800" />

                  <section>
                    <h3 className="text-sm font-semibold text-zinc-200">{t("admin.teamOnlineBooking")}</h3>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              bookable ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            aria-hidden
                          />
                          <span className="text-sm font-medium text-zinc-100">
                            {t(statusLabelKey)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {t(statusHintKey).replace("{name}", displayName)}
                        </p>
                        {isPending ? (
                          <p className="mt-1 text-xs text-zinc-400">{t("admin.savingBookable")}</p>
                        ) : null}
                        {cardError ? (
                          <p className="mt-1 text-xs text-red-400">{cardError}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={bookable}
                        aria-label={t(statusLabelKey)}
                        disabled={isPending}
                        onClick={() => void toggleBookable(barber)}
                        className={`relative min-h-11 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
                          bookable ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 h-9 w-9 rounded-full bg-white shadow transition ${
                            bookable ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </section>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={shopPath(`/admin/staff/${barber.id}`)}
                      className="min-h-11 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200"
                    >
                      {t("admin.editBarber")}
                    </Link>
                    <Link
                      href={shopPath(`/admin/my-schedule?barber=${barber.id}`)}
                      className="min-h-11 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200"
                    >
                      {t("admin.nav.schedule")}
                    </Link>
                  </div>
                </div>
              );
            })}
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
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                      <p className="text-[11px] text-zinc-500">{t("admin.removedBarberStatus")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void restoreToShop(barber)}
                    className="min-h-11 rounded-lg border border-zinc-700 px-3 text-[11px] text-zinc-200 disabled:opacity-50"
                  >
                    {t("admin.restoreToShop")}
                  </button>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <StaffActionsSheet
          barber={menuBarber}
          onClose={() => setMenuBarber(null)}
          onUnlink={() => {
            if (!menuBarber) return;
            setConfirmAction({ type: "unlink", barber: menuBarber });
            setMenuBarber(null);
          }}
          onRemove={() => {
            if (!menuBarber) return;
            setConfirmAction({ type: "remove", barber: menuBarber });
            setMenuBarber(null);
          }}
        />
      </div>
    </AdminShell>
  );
}
