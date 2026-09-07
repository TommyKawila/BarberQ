"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";
import type { Barber } from "@/types/booking";

interface RecurringBreakRow {
  id: string;
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

const WEEKDAYS: { value: number; key: MessageKey }[] = [
  { value: 0, key: "common.sunday" },
  { value: 1, key: "common.monday" },
  { value: 2, key: "common.tuesday" },
  { value: 3, key: "common.wednesday" },
  { value: 4, key: "common.thursday" },
  { value: 5, key: "common.friday" },
  { value: 6, key: "common.saturday" },
];

export default function MySchedulePage() {
  const { t } = useI18n();
  const {
    tokenInput,
    setTokenInput,
    session,
    meta,
    loading,
    error,
    setError,
    authHeaders,
    unlock,
    needsUnlock,
  } = useAdminSession();
  const { shopPath } = useShopSlug();

  const barberId = session?.barberId ?? null;
  const [barber, setBarber] = useState<Barber | null>(null);
  const [breaks, setBreaks] = useState<RecurringBreakRow[]>([]);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [savingOffDays, setSavingOffDays] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [offDaysMessage, setOffDaysMessage] = useState<string | null>(null);
  const [durationMessage, setDurationMessage] = useState<string | null>(null);
  const [breakMessage, setBreakMessage] = useState<string | null>(null);
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [breakWeekday, setBreakWeekday] = useState(1);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [creatingBreak, setCreatingBreak] = useState(false);

  const weekdayLabel = useMemo(() => {
    const map = new Map(WEEKDAYS.map((day) => [day.value, t(day.key)]));
    return (weekday: number) => map.get(weekday) ?? String(weekday);
  }, [t]);

  const loadSchedule = useCallback(async () => {
    if (!barberId) return;
    const [barberRes, breaksRes] = await Promise.all([
      fetch(`/api/barbers/${barberId}`, { headers: authHeaders }),
      fetch(`/api/barbers/${barberId}/breaks`, { headers: authHeaders }),
    ]);
    const barberJson = (await barberRes.json()) as { barber?: Barber } & ApiError;
    const breaksJson = (await breaksRes.json()) as { breaks?: RecurringBreakRow[] } & ApiError;
    if (!barberRes.ok) {
      setError(barberJson.error?.message ?? t("admin.loadFailed"));
      return;
    }
    if (!breaksRes.ok) {
      setError(breaksJson.error?.message ?? t("admin.loadFailed"));
      return;
    }
    setError(null);
    const nextBarber = barberJson.barber ?? null;
    setBarber(nextBarber);
    setOffDays(nextBarber?.off_days ?? []);
    setSlotDuration(nextBarber?.slot_duration_minutes ?? 30);
    setBreaks(breaksJson.breaks ?? []);
  }, [authHeaders, barberId, setError, t]);

  useEffect(() => {
    if (loading || needsUnlock || !barberId) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadSchedule();
    })();
    return () => {
      cancelled = true;
    };
  }, [barberId, loadSchedule, loading, needsUnlock]);

  function toggleOffDay(day: number) {
    setOffDaysMessage(null);
    setOffDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  async function saveOffDays() {
    if (!barberId) return;
    if (offDays.length >= 7) {
      setOffDaysMessage(t("admin.offDaysInvalid"));
      return;
    }
    setSavingOffDays(true);
    setOffDaysMessage(null);
    const res = await fetch(`/api/barbers/${barberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ offDays }),
    });
    const json = (await res.json()) as { barber?: Barber } & ApiError;
    if (!res.ok) {
      setOffDaysMessage(json.error?.message ?? t("admin.updateFailed"));
      setSavingOffDays(false);
      return;
    }
    setBarber(json.barber ?? null);
    setOffDaysMessage(t("admin.settingsSaved"));
    setSavingOffDays(false);
  }

  async function saveDuration() {
    if (!barberId) return;
    setSavingDuration(true);
    setDurationMessage(null);
    const res = await fetch(`/api/barbers/${barberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ slotDuration }),
    });
    const json = (await res.json()) as { barber?: Barber } & ApiError;
    if (!res.ok) {
      setDurationMessage(json.error?.message ?? t("admin.updateFailed"));
      setSavingDuration(false);
      return;
    }
    setBarber(json.barber ?? null);
    setDurationMessage(t("admin.settingsSaved"));
    setSavingDuration(false);
  }

  async function createBreak() {
    if (!barberId) return;
    setCreatingBreak(true);
    setBreakMessage(null);
    const res = await fetch(`/api/barbers/${barberId}/breaks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        weekday: breakWeekday,
        startTime: breakStart,
        endTime: breakEnd,
      }),
    });
    const json = (await res.json()) as ApiError;
    if (!res.ok) {
      setBreakMessage(json.error?.message ?? t("admin.updateFailed"));
      setCreatingBreak(false);
      return;
    }
    setBreakMessage(t("admin.breakCreated"));
    setShowBreakForm(false);
    setCreatingBreak(false);
    await loadSchedule();
  }

  async function deleteBreak(breakId: string) {
    if (!barberId) return;
    setBreakMessage(null);
    const res = await fetch(`/api/barbers/${barberId}/breaks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ breakId }),
    });
    const json = (await res.json()) as ApiError;
    if (!res.ok) {
      setBreakMessage(json.error?.message ?? t("admin.updateFailed"));
      return;
    }
    setBreakMessage(t("admin.breakDeleted"));
    await loadSchedule();
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
        <h1 className="text-2xl font-semibold">{t("admin.mySchedule")}</h1>
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

  if (!barberId) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.mySchedule")}</h1>
        <p className="text-sm text-red-400">{t("admin.noBarberLinked")}</p>
        <Link href={shopPath("/admin")} className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          {meta.prototypeMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <h1 className="text-xl font-semibold">{t("admin.mySchedule")}</h1>
          {barber ? <p className="mt-1 text-xs text-zinc-500">{barber.name}</p> : null}
        </div>
        <Link
          href={shopPath("/admin")}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
        >
          {t("admin.backToBoard")}
        </Link>
      </header>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.offDays")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={offDays.includes(day.value)}
                onChange={() => toggleOffDay(day.value)}
              />
              {t(day.key)}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={savingOffDays}
          onClick={() => void saveOffDays()}
          className="mt-3 min-h-11 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("admin.saveOffDays")}
        </button>
        {offDaysMessage ? <p className="mt-2 text-sm text-emerald-400">{offDaysMessage}</p> : null}
      </section>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.slotDuration")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALLOWED_SLOT_DURATIONS.map((minutes) => (
            <label key={minutes} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="slotDuration"
                checked={slotDuration === minutes}
                onChange={() => setSlotDuration(minutes)}
              />
              {minutes} {t("common.minutes")}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={savingDuration}
          onClick={() => void saveDuration()}
          className="mt-3 min-h-11 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("admin.saveDuration")}
        </button>
        {durationMessage ? <p className="mt-2 text-sm text-emerald-400">{durationMessage}</p> : null}
      </section>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.recurringBreaks")}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {breaks.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("admin.noBreaks")}</p>
          ) : (
            breaks.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm"
              >
                <span>
                  {weekdayLabel(item.weekday)} {item.startTime}-{item.endTime}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteBreak(item.id)}
                  className="rounded border border-red-800 px-2 py-1 text-xs text-red-300"
                >
                  {t("admin.deleteBreak")}
                </button>
              </div>
            ))
          )}
        </div>
        {showBreakForm ? (
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              {t("admin.selectDay")}
              <select
                value={breakWeekday}
                onChange={(event) => setBreakWeekday(Number(event.target.value))}
                className="min-h-10 rounded-lg bg-zinc-800 px-3"
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {t(day.key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("admin.startTime")}
              <input
                type="time"
                value={breakStart}
                onChange={(event) => setBreakStart(event.target.value)}
                className="min-h-10 rounded-lg bg-zinc-800 px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("admin.endTime")}
              <input
                type="time"
                value={breakEnd}
                onChange={(event) => setBreakEnd(event.target.value)}
                className="min-h-10 rounded-lg bg-zinc-800 px-3"
              />
            </label>
            <button
              type="button"
              disabled={creatingBreak}
              onClick={() => void createBreak()}
              className="min-h-11 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("admin.createBreak")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowBreakForm(true)}
            className="mt-3 min-h-11 w-full rounded-xl border border-zinc-700 text-sm text-zinc-200"
          >
            {t("admin.addBreak")}
          </button>
        )}
        {breakMessage ? <p className="mt-2 text-sm text-emerald-400">{breakMessage}</p> : null}
      </section>
    </div>
  );
}
