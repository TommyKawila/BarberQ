"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { StaffBookingSheet } from "@/components/admin/StaffBookingSheet";
import { WhoIsFreeSheet } from "@/components/admin/WhoIsFreeSheet";
import { QrWaitingBoard } from "@/components/admin/QrWaitingBoard";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { useAdminTodayDerived } from "@/lib/admin/use-admin-today-derived";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { formatLastUpdated, useOnlineStatus } from "@/hooks/useOnlineStatus";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import type { ShopActivation } from "@/lib/onboarding/activation";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot, StaffBookingSource } from "@/types/booking";
import type { FreeBarberNow } from "@/lib/admin/free-barbers";

interface ApiError {
  error?: {
    code?: string;
    message?: string;
    canShortenUntil?: string;
    nextConflictAt?: string;
  };
}

export default function AdminPage() {
  const { locale, t } = useI18n();
  const { shopApi, shopPath, shopSlug } = useShopSlug();
  const { ready, profile, error: authError, authHeaders, mockMode } = useAdminPageAuth();
  const toast = useToast();
  const online = useOnlineStatus();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [columns, setColumns] = useState<AdminColumn[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [outcomePendingKey, setOutcomePendingKey] = useState<string | null>(null);
  const [latePendingKey, setLatePendingKey] = useState<string | null>(null);
  const [cancelPendingKey, setCancelPendingKey] = useState<string | null>(null);
  const [reschedulePendingKey, setReschedulePendingKey] = useState<string | null>(null);
  const [rescheduleFrom, setRescheduleFrom] = useState<{
    appointmentId: string;
    customerName: string;
    customerLineId?: string | null;
  } | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    barberId: string;
    slot: AdminSlot;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [activation, setActivation] = useState<ShopActivation | null>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [lineQuotaFull, setLineQuotaFull] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dateISO, setDateISO] = useState(() => dateISOFromInstant(new Date()));
  const [showClosedQueue, setShowClosedQueue] = useState(false);
  const [sheet, setSheet] = useState<{
    barberId: string;
    barberName: string;
    slot: AdminSlot;
    shortenUntil?: string | null;
  } | null>(null);
  const [whoFreeOpen, setWhoFreeOpen] = useState(false);
  const todayISO = dateISOFromInstant(new Date());
  const isToday = dateISO === todayISO;
  const dateLocale = locale === "th" ? th : enUS;
  const displayDate = useMemo(
    () =>
      formatInTimeZone(
        fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE),
        SHOP_TIMEZONE,
        "EEEE d MMMM yyyy",
        { locale: dateLocale },
      ),
    [dateISO, dateLocale],
  );
  // Unconditional — never after auth early-return (React #310).
  const { freeNow, mini, hasBookingsToday, setupIncomplete } = useAdminTodayDerived(
    columns,
    isToday,
    activation,
  );

  function shiftDay(days: number) {
    const noon = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
    setDateISO(dateISOFromInstant(addDays(noon, days)));
  }

  const loadDay = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date: dateISO });
      if (showClosedQueue) params.set("includeClosed", "1");
      const res = await fetch(shopApi(`/block?${params.toString()}`), {
        headers: authHeaders,
      });
      const json = (await res.json()) as {
        columns?: AdminColumn[];
      } & ApiError;
      if (!res.ok) {
        const msg = json.error?.message ?? t("admin.loadFailed");
        setError(msg);
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else toast.error(t("admin.toast.refreshFailed"));
        return;
      }
      setError(null);
      setColumns(json.columns ?? []);
      setLastUpdated(new Date());
    } catch {
      setError(t("admin.networkError"));
      toast.error(t("admin.toast.refreshFailed"));
    }
  }, [authHeaders, dateISO, shopApi, showClosedQueue, t, toast]);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    void fetch(shopApi("/setup"), { headers: authHeaders })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as {
          activation?: ShopActivation;
          bookingUrl?: string;
        };
        setActivation(json.activation ?? null);
        setBookingUrl(json.bookingUrl ?? buildShopLiffUrl(shopSlug) ?? buildShopWebUrl(shopSlug));
      })
      .catch(() => {});
    void Promise.all([
      fetch(shopApi("/line-quota"), { headers: authHeaders }),
      fetch(shopApi("/settings"), { headers: authHeaders }),
    ])
      .then(async ([quotaRes, settingsRes]) => {
        if (quotaRes.ok) {
          const q = (await quotaRes.json()) as { quota?: { level?: string } };
          setLineQuotaFull(q.quota?.level === "full");
        }
        if (settingsRes.ok) {
          const s = (await settingsRes.json()) as { remindersEnabled?: boolean };
          setRemindersEnabled(Boolean(s.remindersEnabled));
        }
      })
      .catch(() => {});
  }, [authHeaders, profile, ready, shopApi, shopSlug]);

  useEffect(() => {
    if (!ready || !profile) return;
    let cancelled = false;

    async function refresh() {
      if (cancelled || document.hidden) return;
      await loadDay();
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 10_000);

    function onVisible() {
      if (!document.hidden) void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadDay, profile, ready]);

  function openSheetForSlot(barberId: string, slot: AdminSlot) {
    const column = columns.find((c) => c.barber.id === barberId);
    setSheet({
      barberId,
      barberName: column?.barber.name ?? "",
      slot,
      shortenUntil: null,
    });
  }

  function findNextFreeSlot(barberId: string): AdminSlot | null {
    const column = columns.find((c) => c.barber.id === barberId);
    if (!column) return null;
    const now = Date.now();
    return (
      column.slots.find(
        (s) => s.kind === "free" && s.available && new Date(s.startTime).getTime() >= now - 5 * 60_000,
      ) ??
      column.slots.find((s) => s.kind === "free" && s.available) ??
      null
    );
  }

  async function createStaffBooking(input: {
    barberId: string;
    startTime: string;
    endTime?: string;
    source: StaffBookingSource;
    customerName?: string;
    customerPhone?: string;
  }) {
    const key = `${input.barberId}:${input.startTime}`;
    setPendingKey(key);
    setError(null);
    const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
    try {
      const res = await fetch(shopApi("/staff-bookings"), {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        if (json.error?.canShortenUntil && sheet) {
          setSheet({ ...sheet, shortenUntil: json.error.canShortenUntil });
          return;
        }
        const msg = json.error?.message ?? t("admin.staffBook.slotTaken");
        setError(msg);
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else if (json.error?.code?.includes("LINE")) toast.error(t("admin.toast.lineSendFailed"));
        return;
      }
      setSheet(null);
      toast.success(t("admin.toast.success"));
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setPendingKey(null);
    }
  }

  async function onBlockSlot(barberId: string, slot: AdminSlot) {
    const key = `${barberId}:${slot.startTime}`;
    setPendingKey(key);
    setError(null);
    const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
    try {
      const res = await fetch(shopApi("/block"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          barberId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason: "manual",
        }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setSheet(null);
      await loadDay();
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setPendingKey(null);
    }
  }

  async function onUnblock(_barberId: string, slot: AdminSlot) {
    if (!slot.blockId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setPendingKey(key);
    setError(null);
    try {
      const res = await fetch(shopApi("/block"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id: slot.blockId }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setPendingKey(null);
    }
  }

  async function onOutcome(
    _barberId: string,
    slot: AdminSlot,
    outcome: "completed" | "no_show" | "left",
  ) {
    if (!profile || !slot.appointmentId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setOutcomePendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ outcome }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else if (json.error?.code?.includes("LINE")) toast.error(t("admin.toast.lineSendFailed"));
        return;
      }
      toast.success(t("admin.toast.success"));
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setOutcomePendingKey(null);
    }
  }

  async function onLateCalled(_barberId: string, slot: AdminSlot) {
    if (!profile || !slot.appointmentId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setLatePendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/late-called`, {
        method: "PATCH",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLatePendingKey(null);
    }
  }

  async function onCancel(_barberId: string, slot: AdminSlot) {
    if (!profile || !slot.appointmentId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setCancelPendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/cancel`, {
        method: "PATCH",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setCancelPendingKey(null);
    }
  }

  function onRescheduleStart(_barberId: string, slot: AdminSlot) {
    if (!slot.appointmentId) return;
    setRescheduleFrom({
      appointmentId: slot.appointmentId,
      customerName: slot.customerName ?? "ลูกค้า",
      customerLineId: slot.customerLineId,
    });
    setRescheduleTarget(null);
    setError(null);
  }

  async function confirmStaffReschedule() {
    if (!profile || !rescheduleFrom || !rescheduleTarget) return;
    const key = `${rescheduleTarget.barberId}:${rescheduleTarget.slot.startTime}`;
    setReschedulePendingKey(key);
    setError(null);
    try {
      const res = await fetch(
        `/api/appointments/${rescheduleFrom.appointmentId}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            barberId: rescheduleTarget.barberId,
            startTime: rescheduleTarget.slot.startTime,
          }),
        },
      );
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setRescheduleFrom(null);
      setRescheduleTarget(null);
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setReschedulePendingKey(null);
    }
  }

  function handleFreeSlot(barberId: string, slot: AdminSlot) {
    if (rescheduleFrom) {
      setRescheduleTarget({ barberId, slot });
      return;
    }
    openSheetForSlot(barberId, slot);
  }

  function onWalkInQuick(barberId: string) {
    const slot = findNextFreeSlot(barberId);
    if (!slot) {
      setError(t("admin.staffBook.noFreeBarber"));
      return;
    }
    void createStaffBooking({
      barberId,
      startTime: new Date().toISOString(),
      source: "walk_in",
    });
  }

  function onWhoIsFree() {
    setWhoFreeOpen(true);
  }

  function onWalkInFromFreeSheet(row: FreeBarberNow) {
    setWhoFreeOpen(false);
    setSheet({
      barberId: row.barberId,
      barberName: row.barberName,
      slot: row.slot,
      shortenUntil: null,
    });
  }

  if (!ready || !profile) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
      </section>
    );
  }

  const isOperator = isShopOperatorRole(profile.role);
  const editableBarberId = isOperator ? null : profile.barberId;
  const badgeRole = profile.role;

  async function copyBookingLink() {
    const url = bookingUrl || buildShopLiffUrl(shopSlug) || buildShopWebUrl(shopSlug);
    await navigator.clipboard.writeText(url);
    setBookingLinkCopied(true);
    toast.success(t("admin.toast.copyBookingLink"));
    window.setTimeout(() => setBookingLinkCopied(false), 2000);
  }

  const thumbBar =
    isToday && isOperator ? (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onWhoIsFree}
          className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100"
        >
          {t("admin.whoIsFree")}
        </button>
        <button
          type="button"
          onClick={() => {
            const first = freeNow[0];
            if (first) onWalkInFromFreeSheet(first);
            else onWhoIsFree();
          }}
          className="flex min-h-12 flex-[1.2] items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
        >
          + Walk-in
        </button>
      </div>
    ) : undefined;

  return (
    <AdminShell role={profile.role} thumbBar={thumbBar}>
      <div
        className={`flex flex-col gap-4 px-3 py-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6${
          rescheduleFrom || thumbBar ? " pb-28 lg:pb-4" : ""
        }`}
      >
        <header className="flex flex-col gap-3">
          <div className="min-w-0">
            {mockMode ? (
              <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-amber-400">
                {t("common.prototypeMode")}
              </span>
            ) : null}
            <h1 className="font-heading text-xl font-semibold">
              {isToday ? t("admin.todayTap") : t("admin.dateDisplay")}
            </h1>
            <p className="text-sm text-zinc-400">
              {displayDate}
              {lastUpdated ? (
                <span className="ml-2 text-xs text-zinc-500">
                  · {formatLastUpdated(lastUpdated, locale === "th" ? "th" : "en")}
                </span>
              ) : null}
            </p>
            <AdminSessionBadge name={profile.displayName || profile.barberName} role={badgeRole} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              className="min-h-11 min-w-11 rounded-xl bg-zinc-800 text-sm text-zinc-200"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={isToday}
              onClick={() => setDateISO(todayISO)}
              className="min-h-11 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-200 disabled:opacity-40"
            >
              {t("admin.today")}
            </button>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              className="min-h-11 min-w-11 rounded-xl bg-zinc-800 text-sm text-zinc-200"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => void loadDay()}
              className="min-h-11 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-200"
            >
              {t("admin.refresh")}
            </button>
          </div>
          {isOperator ? (
            <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-300">
              <button
                type="button"
                role="switch"
                aria-checked={showClosedQueue}
                onClick={() => setShowClosedQueue((v) => !v)}
                className={`relative min-h-11 w-14 shrink-0 rounded-full transition ${
                  showClosedQueue ? "bg-amber-400" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-9 w-9 rounded-full bg-white shadow transition ${
                    showClosedQueue ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              {t("admin.showClosedQueueBarbers")}
            </label>
          ) : null}
        </header>

        <OfflineBanner message={t("admin.offlineBanner")} visible={!online} />

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 lg:max-w-md">
          <div className="text-center">
            <p className="font-heading text-lg font-semibold tabular-nums text-amber-400">{mini.remaining}</p>
            <p className="text-xs text-zinc-400">
              {t("admin.miniRemaining").replace("{n}", String(mini.remaining))}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-lg font-semibold tabular-nums text-zinc-100">{mini.done}</p>
            <p className="text-xs text-zinc-400">
              {t("admin.miniDone").replace("{n}", String(mini.done))}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-lg font-semibold tabular-nums text-emerald-400">{mini.freeSlots}</p>
            <p className="text-xs text-zinc-400">
              {t("admin.miniFree").replace("{n}", String(mini.freeSlots))}
            </p>
          </div>
        </div>

        {isToday ? (
          <QrWaitingBoard
            shopApi={shopApi}
            authHeaders={authHeaders}
            enabled={Boolean(profile)}
            onStarted={() => void loadDay()}
          />
        ) : null}

        <div className="flex flex-wrap gap-1.5 text-xs text-zinc-400">
          <span className="rounded bg-emerald-700 px-2 py-0.5 text-white">{t("admin.open")}</span>
          <span className="rounded bg-sky-700 px-2 py-0.5 text-white">{t("admin.sourceLine")}</span>
          <span className="rounded bg-rose-700 px-2 py-0.5 text-white">{t("admin.sourceWalkIn")}</span>
          <span className="rounded border border-red-500/60 bg-red-950 px-2 py-0.5 text-red-200">
            {t("admin.staffBook.blockTime")}
          </span>
          <span className="rounded bg-yellow-600 px-2 py-0.5 text-zinc-950">{t("admin.late")}</span>
          <span className="rounded bg-zinc-600 px-2 py-0.5 text-white">{t("admin.completed")}</span>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {isOperator && remindersEnabled && lineQuotaFull ? (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4">
            <p className="text-sm font-medium text-red-100">{t("admin.reminderBoardBannerTitle")}</p>
            <Link
              href={shopPath("/admin/settings/line/quota")}
              className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {t("admin.reminderBoardBannerCta")}
            </Link>
          </div>
        ) : null}
        {rescheduleFrom ? (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/50 bg-zinc-950/95 p-4 pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-t-2xl"
            data-testid="admin-reschedule-banner"
            role="status"
          >
            <p className="text-sm font-medium text-amber-100">
              {t("admin.rescheduleModeBanner").replace(
                "{name}",
                rescheduleFrom.customerName,
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setRescheduleFrom(null);
                setRescheduleTarget(null);
              }}
              className="mt-3 min-h-11 w-full rounded-xl border border-zinc-600 text-sm text-zinc-200"
            >
              {t("admin.rescheduleModeCancel")}
            </button>
          </div>
        ) : null}
        {isOperator && setupIncomplete ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-200">{t("admin.onboardingChecklistTitle")}</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
              {!activation?.teamOk ? <li>• {t("onboarding.noBookableBarber")}</li> : null}
              {!activation?.hoursOk ? <li>• {t("onboarding.noHours")}</li> : null}
              {activation && !activation.ready && activation.teamOk && activation.hoursOk ? (
                <li>• {t("onboarding.bannerIncomplete")}</li>
              ) : null}
            </ul>
            <Link
              href={shopPath(
                !activation?.teamOk
                  ? "/admin/setup?step=team"
                  : !activation?.hoursOk
                    ? "/admin/setup?step=hours"
                    : "/admin/setup",
              )}
              className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOperator && isToday && !hasBookingsToday && activation?.ready ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noBookingsToday")}</p>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-600 text-sm font-semibold text-zinc-100"
            >
              {bookingLinkCopied ? t("admin.toast.copyBookingLink") : t("onboarding.copyLink")}
            </button>
          </div>
        ) : null}
        <div className="lg:col-span-2">
          <QuickBlockGrid
            columns={columns}
            pendingKey={pendingKey}
            outcomePendingKey={outcomePendingKey}
            latePendingKey={latePendingKey}
            cancelPendingKey={cancelPendingKey}
            editableBarberId={editableBarberId}
            onFreeSlot={(id, slot) => handleFreeSlot(id, slot)}
            onWalkInQuick={(id) => onWalkInQuick(id)}
            onOutcome={(id, slot, outcome) => void onOutcome(id, slot, outcome)}
            onLateCalled={(id, slot) => void onLateCalled(id, slot)}
            onCancel={(id, slot) => void onCancel(id, slot)}
            onRescheduleStart={(id, slot) => onRescheduleStart(id, slot)}
            onUnblock={(id, slot) => void onUnblock(id, slot)}
            reschedulePickMode={Boolean(rescheduleFrom)}
            bookingHref={shopPath("/")}
            onCopyBookingLink={() => void copyBookingLink()}
            bookingLinkCopied={bookingLinkCopied}
          />
        </div>
        {rescheduleTarget && rescheduleFrom ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
            <button
              type="button"
              aria-label={t("common.cancel")}
              className="absolute inset-0"
              onClick={() => setRescheduleTarget(null)}
              disabled={Boolean(reschedulePendingKey)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-md rounded-t-2xl bg-zinc-950 px-4 pb-8 pt-4 shadow-xl sm:rounded-2xl"
              data-testid="admin-reschedule-confirm"
            >
              <h2 className="text-base font-semibold">{t("admin.confirmRescheduleTitle")}</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {rescheduleFrom.customerLineId?.trim()
                  ? t("admin.confirmRescheduleBodyLine")
                  : t("admin.confirmRescheduleBodyNoLine")}
              </p>
              <button
                type="button"
                disabled={Boolean(reschedulePendingKey)}
                onClick={() => void confirmStaffReschedule()}
                className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
              >
                {t("admin.confirmRescheduleAction")}
              </button>
              <button
                type="button"
                disabled={Boolean(reschedulePendingKey)}
                onClick={() => setRescheduleTarget(null)}
                className="mt-2 min-h-11 w-full rounded-xl border border-zinc-700 text-sm text-zinc-200 disabled:opacity-50"
              >
                {t("common.back")}
              </button>
            </div>
          </div>
        ) : null}
        {sheet ? (
          <StaffBookingSheet
            open
            barberId={sheet.barberId}
            barberName={sheet.barberName}
            slot={sheet.slot}
            pending={pendingKey === `${sheet.barberId}:${sheet.slot.startTime}`}
            shortenUntil={sheet.shortenUntil}
            onClose={() => setSheet(null)}
            onWalkInNow={() =>
              void createStaffBooking({
                barberId: sheet.barberId,
                startTime: sheet.slot.startTime,
                source: "walk_in",
              })
            }
            onStaffBooking={(input) =>
              void createStaffBooking({
                barberId: sheet.barberId,
                startTime: sheet.slot.startTime,
                endTime: input.endTime,
                source: input.source,
                customerName: input.customerName,
                customerPhone: input.customerPhone,
              })
            }
            onBlock={() => void onBlockSlot(sheet.barberId, sheet.slot)}
          />
        ) : null}
        <WhoIsFreeSheet
          open={whoFreeOpen}
          rows={freeNow}
          onClose={() => setWhoFreeOpen(false)}
          onWalkIn={onWalkInFromFreeSheet}
        />
      </div>
    </AdminShell>
  );
}
