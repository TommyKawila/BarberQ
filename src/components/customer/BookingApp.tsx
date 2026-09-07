"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { BarberSelector } from "@/components/customer/BarberSelector";
import { DateSelector } from "@/components/customer/DateSelector";
import { SlotPicker } from "@/components/customer/SlotPicker";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import {
  formatSlotTime,
  getBangkokWeekday,
  getBookableDates,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { type Barber, type Slot } from "@/types/booking";

const PHONE_KEY = "barberq_phone";
const POLL_MS = 10_000;

interface ApiError {
  error?: { code?: string; message?: string };
}

export function BookingApp() {
  const { t } = useI18n();
  const { shopApi, shopPath } = useShopSlug();
  const { ready, profile, login, mockMode } = useLineAuth();
  const dates = useMemo(() => getBookableDates(), []);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [prototypeMode, setPrototypeMode] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(dates[0] ?? null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useBrowserStorage(PHONE_KEY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedStartRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    selectedStartRef.current = selectedStart;
  }, [selectedStart]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    if (profile?.displayName && !customerName) {
      setCustomerName(profile.displayName);
    }
  }, [profile, customerName]);

  const selectedBarber = barbers.find((item) => item.id === barberId) ?? null;
  const activeDate = useMemo(() => {
    if (!selectedBarber || !dateISO) return dateISO;
    if (!selectedBarber.off_days.includes(getBangkokWeekday(dateISO))) return dateISO;
    return (
      dates.find((d) => !selectedBarber.off_days.includes(getBangkokWeekday(d))) ?? dateISO
    );
  }, [selectedBarber, dateISO, dates]);

  const loadSlots = useCallback(
    async (targetBarberId: string, targetDate: string, silent: boolean) => {
      if (!silent) {
        setSlotsLoading(true);
        setSelectedStart(null);
      }
      const res = await fetch(
        shopApi(`/slots?barberId=${encodeURIComponent(targetBarberId)}&date=${encodeURIComponent(targetDate)}`),
      );
      const json = (await res.json()) as { slots?: Slot[] };
      const fresh = json.slots ?? [];
      setSlots(fresh);
      setLastUpdated(new Date());
      if (!silent) {
        setSlotsLoading(false);
      } else {
        const current = selectedStartRef.current;
        if (current && !fresh.some((s) => s.startTime === current && s.available)) {
          setSelectedStart(null);
          setMessage(t("booking.slotUnavailable"));
        }
      }
      return fresh;
    },
    [shopApi, t],
  );

  const silentRefresh = useCallback(async () => {
    if (!barberId || !activeDate) return;
    if (selectedBarber?.off_days.includes(getBangkokWeekday(activeDate))) return;
    await loadSlots(barberId, activeDate, true);
  }, [barberId, activeDate, selectedBarber, loadSlots]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(shopApi("/barbers"));
      const json = (await res.json()) as {
        barbers?: Barber[];
        prototypeMode?: boolean;
      } & ApiError;
      if (cancelled || !json.barbers?.length) return;
      setBarbers(json.barbers);
      setPrototypeMode(json.prototypeMode ?? true);
      setBarberId((current) => current ?? json.barbers![0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, [shopApi]);

  useEffect(() => {
    if (!barberId || !activeDate) return;
    if (selectedBarber?.off_days.includes(getBangkokWeekday(activeDate))) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadSlots(barberId, activeDate, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [barberId, activeDate, selectedBarber, loadSlots]);

  useEffect(() => {
    if (!barberId || !activeDate) return;
    if (selectedBarber?.off_days.includes(getBangkokWeekday(activeDate))) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (submittingRef.current) return;
      void silentRefresh();
    };

    const timer = window.setInterval(tick, POLL_MS);
    window.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [barberId, activeDate, selectedBarber, silentRefresh]);

  async function submitBooking() {
    if (!barberId || !selectedStart || !profile) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          startTime: selectedStart,
          customerName,
          customerPhone: phone ?? "",
          customerRef: profile.userId,
          customerLineId: profile.userId,
        }),
      });
      const json = (await res.json()) as { appointment?: { id: string } } & ApiError;
      if (!res.ok || !json.appointment) {
        const code = json.error?.code;
        if (code === "SLOT_TAKEN" || code === "SLOT_BLOCKED") {
          setMessage(t("booking.slotTaken"));
          setSelectedStart(null);
          void silentRefresh();
        } else {
          setMessage(json.error?.message ?? t("booking.failed"));
        }
        return;
      }
      setPhone((phone ?? "").trim());
      window.location.href = shopPath("/bookings");
    } catch {
      setMessage(t("booking.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (!profile && !mockMode) {
    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("booking.title")}</h1>
        <p className="text-sm text-zinc-400">{t("booking.lineLoginRequired")}</p>
        <button
          type="button"
          onClick={login}
          className="min-h-12 rounded-xl bg-[#06C755] font-semibold text-white"
        >
          {t("booking.loginWithLine")}
        </button>
      </section>
    );
  }

  if (!profile) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  const selectedSlot = slots.find((slot) => slot.startTime === selectedStart);

  return (
    <div className="flex flex-col gap-6 px-4 pb-28 pt-5">
      <header>
        {prototypeMode ? (
          <span className="mb-2 inline-block rounded bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-400">
            {t("common.prototypeMode")}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold">{t("booking.title")}</h1>
        {profile.displayName ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {profile.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-amber-400">
                  {profile.displayName.charAt(0)}
                </span>
              )}
              <p className="truncate text-sm text-zinc-300">
                {t("booking.hello").replace("{name}", profile.displayName)}
              </p>
            </div>
            <Link href={shopPath("/bookings")} className="shrink-0 text-sm text-amber-400 underline">
              {t("booking.myBookings")}
            </Link>
          </div>
        ) : (
          <div className="mt-2 flex justify-end">
            <Link href={shopPath("/bookings")} className="text-sm text-amber-400 underline">
              {t("booking.myBookings")}
            </Link>
          </div>
        )}
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-400">{t("booking.barber")}</h2>
        <BarberSelector barbers={barbers} value={barberId} onChange={setBarberId} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-400">{t("booking.date")}</h2>
        <DateSelector
          dates={dates}
          value={activeDate}
          barber={selectedBarber}
          onChange={setDateISO}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-400">{t("booking.time")}</h2>
          {lastUpdated ? (
            <p className="text-[10px] text-zinc-600">
              {t("booking.lastUpdated")}{" "}
              {formatInTimeZone(lastUpdated, SHOP_TIMEZONE, "HH:mm:ss")}
            </p>
          ) : null}
        </div>
        <SlotPicker
          slots={slots}
          value={selectedStart}
          loading={slotsLoading}
          onChange={(start) => {
            setSelectedStart(start);
            setMessage(null);
          }}
        />
      </section>

      {message && !selectedSlot ? (
        <p className="text-sm text-amber-400">{message}</p>
      ) : null}

      {selectedSlot ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-zinc-900 p-4">
          <label className="flex flex-col gap-1 text-sm">
            {t("booking.name")}
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder={t("booking.namePlaceholder")}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("booking.phone")}
            <input
              value={phone ?? ""}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              placeholder={t("booking.phonePlaceholder")}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
            />
          </label>
          {message ? <p className="text-sm text-red-400">{message}</p> : null}
          <button
            type="button"
            disabled={submitting || !profile}
            onClick={() => void submitBooking()}
            className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {submitting
              ? t("booking.booking")
              : `${t("booking.confirm")} ${formatSlotTime(selectedSlot.startTime)} – ${formatSlotTime(selectedSlot.endTime)}`}
          </button>
        </section>
      ) : null}
    </div>
  );
}
