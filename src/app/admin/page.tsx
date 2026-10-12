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
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import type { ShopActivation } from "@/lib/onboarding/activation";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot, StaffBookingSource } from "@/types/booking";

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
  const [columns, setColumns] = useState<AdminColumn[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [outcomePendingKey, setOutcomePendingKey] = useState<string | null>(null);
  const [latePendingKey, setLatePendingKey] = useState<string | null>(null);
  const [cancelPendingKey, setCancelPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [activation, setActivation] = useState<ShopActivation | null>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [dateISO, setDateISO] = useState(() => dateISOFromInstant(new Date()));
  const [showClosedQueue, setShowClosedQueue] = useState(false);
  const [sheet, setSheet] = useState<{
    barberId: string;
    barberName: string;
    slot: AdminSlot;
    shortenUntil?: string | null;
  } | null>(null);
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
        setError(json.error?.message ?? t("admin.loadFailed"));
        return;
      }
      setError(null);
      setColumns(json.columns ?? []);
    } catch {
      setError(t("admin.networkError"));
    }
  }, [authHeaders, dateISO, shopApi, showClosedQueue, t]);

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
        setError(json.error?.message ?? t("admin.staffBook.slotTaken"));
        return;
      }
      setSheet(null);
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
        return;
      }
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
    const now = Date.now();
    let best: { barberId: string; slot: AdminSlot; freeAt: number } | null = null;
    for (const column of columns) {
      for (const slot of column.slots) {
        if (slot.kind !== "free" || !slot.available) continue;
        const freeAt = new Date(slot.startTime).getTime();
        if (freeAt < now - 5 * 60_000) continue;
        if (!best || freeAt < best.freeAt) {
          best = { barberId: column.barber.id, slot, freeAt };
        }
      }
    }
    if (!best) {
      setError(t("admin.staffBook.noFreeBarber"));
      return;
    }
    void createStaffBooking({
      barberId: best.barberId,
      startTime: new Date().toISOString(),
      source: "walk_in",
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
    window.setTimeout(() => setBookingLinkCopied(false), 2000);
  }

  const hasBookingsToday = columns.some((col) =>
    col.slots.some((slot) => slot.kind === "booked"),
  );

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-3 py-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {mockMode ? (
              <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                {t("common.prototypeMode")}
              </span>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200"
              >
                {t("admin.previousDay")}
              </button>
              <button
                type="button"
                disabled={isToday}
                onClick={() => setDateISO(todayISO)}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 disabled:opacity-40"
              >
                {t("admin.today")}
              </button>
              <button
                type="button"
                onClick={() => shiftDay(1)}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200"
              >
                {t("admin.nextDay")}
              </button>
              <button
                type="button"
                onClick={() => void loadDay()}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200"
              >
                {t("admin.refresh")}
              </button>
              {isToday ? (
                <button
                  type="button"
                  onClick={onWhoIsFree}
                  className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white"
                >
                  {t("admin.whoIsFree")}
                </button>
              ) : null}
            </div>
            {isOperator ? (
              <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={showClosedQueue}
                  onChange={(event) => setShowClosedQueue(event.target.checked)}
                  className="h-4 w-4"
                />
                {t("admin.showClosedQueueBarbers")}
              </label>
            ) : null}
            <h1 className="mt-2 text-xl font-semibold">
              {isToday ? t("admin.todayTap") : t("admin.dateDisplay")}
            </h1>
            <p className="text-sm text-zinc-400">{displayDate}</p>
            <AdminSessionBadge name={profile.displayName || profile.barberName} role={badgeRole} />
          </div>
        </header>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-400 sm:text-[11px]">
          <span className="rounded bg-emerald-700 px-2 py-0.5 text-white">{t("admin.open")}</span>
          <span className="rounded bg-sky-700 px-2 py-0.5 text-white">{t("admin.sourceLine")}</span>
          <span className="rounded bg-teal-700 px-2 py-0.5 text-white">{t("admin.sourcePhone")}</span>
          <span className="rounded bg-indigo-700 px-2 py-0.5 text-white">{t("admin.sourceChat")}</span>
          <span className="rounded bg-rose-700 px-2 py-0.5 text-white">{t("admin.sourceWalkIn")}</span>
          <span className="rounded bg-red-600 px-2 py-0.5 text-white">{t("admin.staffBook.blockTime")}</span>
          <span className="rounded bg-yellow-600 px-2 py-0.5 text-zinc-950">{t("admin.late")}</span>
          <span className="rounded bg-zinc-600 px-2 py-0.5 text-white">{t("admin.completed")}</span>
          <span className="rounded bg-orange-700 px-2 py-0.5 text-white">{t("admin.noShow")}</span>
          <span className="rounded bg-zinc-700 px-2 py-0.5 text-zinc-200">{t("admin.left")}</span>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {isOperator && activation && !activation.ready ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">{t("onboarding.bannerIncomplete")}</p>
            <Link
              href={shopPath("/admin/setup")}
              className="mt-2 flex min-h-11 items-center justify-center rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOperator && activation && !activation.teamOk ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noBookableBarber")}</p>
            <Link href={shopPath("/admin/setup?step=team")} className="mt-2 text-amber-400 underline">
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOperator && activation && !activation.hoursOk ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noHours")}</p>
            <Link href={shopPath("/admin/setup?step=hours")} className="mt-2 text-amber-400 underline">
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
              className="mt-2 min-h-11 w-full rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {bookingLinkCopied ? t("onboarding.copied") : t("onboarding.copyLink")}
            </button>
          </div>
        ) : null}
        <QuickBlockGrid
          columns={columns}
          pendingKey={pendingKey}
          outcomePendingKey={outcomePendingKey}
          latePendingKey={latePendingKey}
          cancelPendingKey={cancelPendingKey}
          editableBarberId={editableBarberId}
          onFreeSlot={(id, slot) => openSheetForSlot(id, slot)}
          onWalkInQuick={(id) => onWalkInQuick(id)}
          onOutcome={(id, slot, outcome) => void onOutcome(id, slot, outcome)}
          onLateCalled={(id, slot) => void onLateCalled(id, slot)}
          onCancel={(id, slot) => void onCancel(id, slot)}
          onUnblock={(id, slot) => void onUnblock(id, slot)}
          bookingHref={shopPath("/")}
          onCopyBookingLink={() => void copyBookingLink()}
          bookingLinkCopied={bookingLinkCopied}
        />
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
      </div>
    </AdminShell>
  );
}
