"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { BarberSelector } from "@/components/customer/BarberSelector";
import { DateSelector } from "@/components/customer/DateSelector";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import { SlotPicker } from "@/components/customer/SlotPicker";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useCustomerIdentity } from "@/lib/identity/mock-identity";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  canCancelAt,
  formatSlotTime,
  getBangkokWeekday,
  getBookableDates,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber, type Slot } from "@/types/booking";

const PHONE_KEY = "barberq_phone";
const LAST_BOOKING_KEY = "barberq_last_booking";
const POLL_MS = 10_000;

interface ApiError {
  error?: { code?: string; message?: string };
}

export function BookingApp() {
  const { locale, t } = useI18n();
  const { ready, identity } = useCustomerIdentity();
  const { lineUrl, phone: shopPhone } = useShopBrand();
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
  const [lastBookingRaw, setLastBookingRaw] = useBrowserStorage(LAST_BOOKING_KEY);
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

  const booked = useMemo(() => {
    if (!lastBookingRaw) return null;
    try {
      return JSON.parse(lastBookingRaw) as Appointment;
    } catch {
      return null;
    }
  }, [lastBookingRaw]);

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
        `/api/slots?barberId=${encodeURIComponent(targetBarberId)}&date=${encodeURIComponent(targetDate)}`,
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
    [t],
  );

  const silentRefresh = useCallback(async () => {
    if (!barberId || !activeDate) return;
    if (selectedBarber?.off_days.includes(getBangkokWeekday(activeDate))) return;
    await loadSlots(barberId, activeDate, true);
  }, [barberId, activeDate, selectedBarber, loadSlots]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/barbers");
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
  }, []);

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
    if (booked || !barberId || !activeDate) return;
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
  }, [booked, barberId, activeDate, selectedBarber, silentRefresh]);

  async function submitBooking() {
    if (!barberId || !selectedStart || !identity) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          startTime: selectedStart,
          customerName,
          customerPhone: phone ?? "",
          customerRef: identity.ref,
        }),
      });
      const json = (await res.json()) as { appointment?: Appointment } & ApiError;
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
      setLastBookingRaw(JSON.stringify(json.appointment));
    } catch {
      setMessage(t("booking.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking() {
    if (!booked || !identity) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          booked.cancel_token
            ? { cancelToken: booked.cancel_token }
            : { appointmentId: booked.id, customerRef: identity.ref },
        ),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setMessage(json.error?.message ?? t("booking.cancelFailed"));
        return;
      }
      setLastBookingRaw(null);
    } catch {
      setMessage(t("booking.cancelFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function bookAnother() {
    setLastBookingRaw(null);
    setSelectedStart(null);
    setMessage(null);
  }

  const dateLocale = locale === "th" ? th : enUS;

  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (booked) {
    const barber = barbers.find((b) => b.id === booked.barber_id);
    const dateLabel = formatInTimeZone(
      new Date(booked.start_time),
      SHOP_TIMEZONE,
      "EEEE d MMM yyyy",
      { locale: dateLocale },
    );
    const cancellable = canCancelAt(booked.start_time);

    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        {prototypeMode ? (
          <span className="self-start rounded bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-400">
            {t("common.prototypeMode")}
          </span>
        ) : null}
        <div className="rounded-2xl bg-zinc-900 p-5">
          <h1 className="text-xl font-semibold">{t("booking.confirmed")}</h1>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">{t("booking.barber")}</dt>
              <dd className="font-medium">
                {barber ? barberLabel(barber.name, locale) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("booking.date")}</dt>
              <dd>{dateLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("booking.time")}</dt>
              <dd className="text-lg font-semibold">
                {formatSlotTime(booked.start_time)} – {formatSlotTime(booked.end_time)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("booking.name")}</dt>
              <dd>{booked.customer_name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("booking.phone")}</dt>
              <dd>{booked.customer_phone}</dd>
            </div>
          </dl>
          {message ? <p className="mt-4 text-sm text-red-400">{message}</p> : null}
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={submitting || !cancellable}
              onClick={() => void cancelBooking()}
              className="min-h-12 rounded-xl bg-red-500 font-semibold text-white disabled:opacity-40"
            >
              {submitting ? t("booking.cancelling") : t("booking.cancel")}
            </button>
            {!cancellable ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-400">{t("booking.cancelTooLate")}</p>
                <ShopContactLinks lineUrl={lineUrl} phone={shopPhone} />
              </div>
            ) : (
              <p className="text-xs text-zinc-500">{t("booking.cancelPolicy")}</p>
            )}
            {cancellable ? <ShopContactLinks lineUrl={lineUrl} phone={shopPhone} /> : null}
            <button
              type="button"
              onClick={bookAnother}
              className="min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-300"
            >
              {t("booking.bookAnother")}
            </button>
          </div>
        </div>
      </section>
    );
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
            disabled={submitting || !identity}
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
