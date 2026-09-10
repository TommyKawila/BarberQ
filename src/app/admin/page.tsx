"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import type { ShopActivation } from "@/lib/onboarding/activation";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { dateISOFromInstant, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
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
    if (!ready || !profile || profile.role !== "owner") return;
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

  async function onToggle(barberId: string, slot: AdminSlot) {
    if (!profile) return;
    const key = `${barberId}:${slot.startTime}`;
    setPendingKey(key);
    setError(null);
    const previous = columns;

    setColumns((current) =>
      current.map((column) => {
        if (column.barber.id !== barberId) return column;
        return {
          ...column,
          slots: column.slots.map((item) => {
            if (item.startTime !== slot.startTime) return item;
            if (slot.kind === "blocked") {
              return { ...item, kind: "free", available: true, blockId: undefined, reason: undefined };
            }
            return { ...item, kind: "blocked", available: false, reason: "walk-in" };
          }),
        };
      }),
    );

    const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };

    try {
      const res =
        slot.kind === "blocked"
          ? await fetch(shopApi("/block"), {
              method: "DELETE",
              headers,
              body: JSON.stringify({ id: slot.blockId }),
            })
          : await fetch(shopApi("/block"), {
              method: "POST",
              headers,
              body: JSON.stringify({
                barberId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                reason: "walk-in",
              }),
            });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setColumns(previous);
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setColumns(previous);
      setError(t("admin.updateFailed"));
    } finally {
      setPendingKey(null);
    }
  }

  async function onOutcome(_barberId: string, slot: AdminSlot, outcome: "completed" | "no_show") {
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

  if (!ready || !profile) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
      </section>
    );
  }

  const isOwner = profile.role === "owner";
  const editableBarberId = isOwner ? null : profile.barberId;
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
            </div>
            {isOwner ? (
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
        <div className="flex gap-2 text-[11px] text-zinc-400">
          <span className="rounded bg-emerald-700 px-2 py-0.5 text-white">{t("admin.open")}</span>
          <span className="rounded bg-red-600 px-2 py-0.5 text-white">{t("admin.walkIn")}</span>
          <span className="rounded bg-sky-700 px-2 py-0.5 text-white">{t("admin.booked")}</span>
          <span className="rounded bg-yellow-600 px-2 py-0.5 text-zinc-950">{t("admin.late")}</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-zinc-950">{t("admin.completed")}</span>
          <span className="rounded bg-orange-700 px-2 py-0.5 text-white">{t("admin.noShow")}</span>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {isOwner && activation && !activation.ready ? (
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
        {isOwner && activation && !activation.teamOk ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noBookableBarber")}</p>
            <Link href={shopPath("/admin/setup?step=team")} className="mt-2 text-amber-400 underline">
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOwner && activation && !activation.hoursOk ? (
          <div className="rounded-xl bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noHours")}</p>
            <Link href={shopPath("/admin/setup?step=hours")} className="mt-2 text-amber-400 underline">
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOwner && isToday && !hasBookingsToday && activation?.ready ? (
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
          onToggle={(id, slot) => void onToggle(id, slot)}
          onOutcome={(id, slot, outcome) => void onOutcome(id, slot, outcome)}
          onLateCalled={(id, slot) => void onLateCalled(id, slot)}
          onCancel={(id, slot) => void onCancel(id, slot)}
          bookingHref={shopPath("/")}
          onCopyBookingLink={() => void copyBookingLink()}
          bookingLinkCopied={bookingLinkCopied}
        />
      </div>
    </AdminShell>
  );
}
