"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { useI18n } from "@/lib/i18n/locale-provider";
import { dateISOFromInstant, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

export default function AdminPage() {
  const { locale, t } = useI18n();
  const {
    tokenInput,
    setTokenInput,
    session,
    meta,
    loading,
    error,
    setError,
    authHeaders,
    loadSession,
    unlock,
    isSuperAdmin,
    needsUnlock,
  } = useAdminSession();
  const [columns, setColumns] = useState<AdminColumn[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [outcomePendingKey, setOutcomePendingKey] = useState<string | null>(null);
  const [latePendingKey, setLatePendingKey] = useState<string | null>(null);
  const [cancelPendingKey, setCancelPendingKey] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState(() => dateISOFromInstant(new Date()));
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
      const res = await fetch(`/api/block?date=${encodeURIComponent(dateISO)}`, {
        headers: authHeaders,
      });
      const json = (await res.json()) as {
        columns?: AdminColumn[];
      } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.loadFailed"));
        if (res.status === 401) void loadSession();
        return;
      }
      setError(null);
      setColumns(json.columns ?? []);
    } catch {
      setError(t("admin.networkError"));
    }
  }, [authHeaders, dateISO, loadSession, setError, t]);

  useEffect(() => {
    if (loading || needsUnlock) return;
    let cancelled = false;

    async function refresh() {
      if (cancelled || document.hidden) return;
      await loadDay();
    }

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await refresh();
    })();

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
  }, [loadDay, loading, needsUnlock]);

  async function onToggle(barberId: string, slot: AdminSlot) {
    if (needsUnlock) return;
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
          ? await fetch("/api/block", {
              method: "DELETE",
              headers,
              body: JSON.stringify({ id: slot.blockId }),
            })
          : await fetch("/api/block", {
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
    if (needsUnlock || !slot.appointmentId) return;
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
    if (needsUnlock || !slot.appointmentId) return;
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
    if (needsUnlock || !slot.appointmentId) return;
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

  if (loading) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (needsUnlock) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
        <p className="text-sm text-zinc-400">{t("admin.unlockHint")}</p>
        <input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          className="min-h-12 rounded-xl bg-zinc-900 px-3 outline-none ring-amber-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={unlock}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          {t("admin.unlock")}
        </button>
      </section>
    );
  }

  const editableBarberId = isSuperAdmin ? null : session?.barberId ?? null;

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {meta.prototypeMode ? (
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
          </div>
          <h1 className="mt-2 text-xl font-semibold">
            {isToday ? t("admin.todayTap") : t("admin.dateDisplay")}
          </h1>
          <p className="text-sm text-zinc-400">{displayDate}</p>
          {session ? (
            <AdminSessionBadge name={session.name} role={session.role} />
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/admin/stats"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
            >
              {t("admin.stats")}
            </Link>
            <Link
              href="/guide"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
            >
              {t("admin.guide")}
            </Link>
            <Link
              href="/admin/my-schedule"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
            >
              {t("admin.mySchedule")}
            </Link>
            {isSuperAdmin ? (
              <>
                <Link
                  href="/admin/staff"
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                >
                  {t("admin.staffManagement")}
                </Link>
                <Link
                  href="/admin/settings"
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                >
                  {t("admin.settings")}
                </Link>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => void loadDay()}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
            >
              {t("admin.refresh")}
            </button>
          </div>
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
      />
    </div>
  );
}
