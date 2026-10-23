"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { BarberSelector } from "@/components/customer/BarberSelector";
import { DateSelector } from "@/components/customer/DateSelector";
import { SlotPicker } from "@/components/customer/SlotPicker";
import {
  bookingErrorI18nKey,
  isShopClosedOnDate,
} from "@/lib/booking/customer-flow";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import {
  DEFAULT_BOOKING_ADVANCE_DAYS,
  formatSlotTime,
  getBookableDates,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber, type Slot } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface RescheduleFlowProps {
  appointment: Appointment;
  barbers: Barber[];
  hours: ShopHours;
  onClose: () => void;
  onDone: (updated: Appointment) => void;
}

export function RescheduleFlow({
  appointment,
  barbers,
  hours,
  onClose,
  onDone,
}: RescheduleFlowProps) {
  const { locale, t } = useI18n();
  const { shopApi } = useShopSlug();
  const { bookingAdvanceDays } = useShopBrand();
  const [barberId, setBarberId] = useState<string | null>(appointment.barber_id);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dates = useMemo(
    () =>
      getBookableDates(
        new Date(),
        bookingAdvanceDays ?? DEFAULT_BOOKING_ADVANCE_DAYS,
      ),
    [bookingAdvanceDays],
  );
  const shopHours = normalizeShopHours(hours);
  const barber = barbers.find((b) => b.id === barberId) ?? null;
  const dateLocale = locale === "th" ? th : enUS;

  useEffect(() => {
    if (!barberId || !dateISO) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedStart(null);
    void (async () => {
      try {
        const params = new URLSearchParams({
          date: dateISO,
          barberId,
          excludeAppointmentId: appointment.id,
        });
        const res = await fetch(`${shopApi("/slots")}?${params.toString()}`);
        const json = (await res.json()) as { slots?: Slot[] };
        if (!cancelled) setSlots(json.slots ?? []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointment.id, barberId, dateISO, shopApi]);

  async function handleConfirm() {
    if (!appointment.cancel_token || !barberId || !selectedStart) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelToken: appointment.cancel_token,
          barberId,
          startTime: selectedStart,
        }),
      });
      const json = (await res.json()) as ApiError & { appointment?: Appointment };
      if (!res.ok) {
        const code = json.error?.code;
        if (code === "SLOT_TAKEN" || code === "SLOT_BLOCKED") {
          setMessage(t("booking.rescheduleSlotTaken"));
        } else if (code === "RESCHEDULE_LIMIT") {
          setMessage(t("booking.rescheduleLimit"));
        } else if (code === "TOO_LATE") {
          setMessage(t("booking.rescheduleTooLate"));
        } else {
          setMessage(t(bookingErrorI18nKey(code)));
        }
        setConfirming(false);
        return;
      }
      if (json.appointment) onDone(json.appointment);
    } catch {
      setMessage(t("booking.rescheduleFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const shopClosed = dateISO ? isShopClosedOnDate(shopHours, dateISO) : false;
  const selectedBarber = barbers.find((b) => b.id === barberId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      data-testid="reschedule-flow"
    >
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        onClick={onClose}
        disabled={submitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-zinc-950 shadow-xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700 sm:hidden" />
        <header className="shrink-0 border-b border-zinc-800 px-4 py-3">
          <h2 id="reschedule-title" className="text-lg font-semibold">
            {t("booking.reschedule")}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">{t("booking.reschedulePolicy")}</p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {message ? <p className="mb-3 text-sm text-red-400">{message}</p> : null}

          {confirming && selectedStart && selectedBarber ? (
            <div className="flex flex-col gap-3" data-testid="reschedule-confirm">
              <p className="text-sm text-zinc-300">{t("booking.rescheduleConfirmHint")}</p>
              <div className="rounded-xl bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">{t("booking.rescheduleNewSlot")}</p>
                <p className="font-semibold">{barberLabel(selectedBarber.name, locale)}</p>
                <p className="text-sm text-zinc-400">
                  {formatInTimeZone(new Date(selectedStart), SHOP_TIMEZONE, "EEEE d MMM yyyy", {
                    locale: dateLocale,
                  })}
                </p>
                <p className="text-lg font-semibold">{formatSlotTime(selectedStart)}</p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirm()}
                className="min-h-12 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                data-testid="reschedule-confirm-btn"
              >
                {submitting ? t("booking.rescheduling") : t("booking.rescheduleConfirm")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-200 disabled:opacity-50"
              >
                {t("common.back")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <section>
                <h3 className="mb-2 text-sm font-medium">{t("booking.stepBarber")}</h3>
                <BarberSelector
                  barbers={barbers}
                  value={barberId}
                  onChange={(id) => {
                    setBarberId(id);
                    setDateISO(null);
                    setSelectedStart(null);
                    setConfirming(false);
                  }}
                />
              </section>

              {barberId ? (
                <section data-testid="reschedule-date-section">
                  <h3 className="mb-2 text-sm font-medium">{t("booking.stepDate")}</h3>
                  <DateSelector
                    dates={dates}
                    value={dateISO}
                    barber={barber}
                    hours={shopHours}
                    onChange={(d) => {
                      setDateISO(d);
                      setSelectedStart(null);
                    }}
                  />
                </section>
              ) : null}

              {barberId && dateISO ? (
                <section data-testid="reschedule-time-section">
                  <h3 className="mb-2 text-sm font-medium">{t("booking.stepTime")}</h3>
                  <SlotPicker
                    slots={slots}
                    value={selectedStart}
                    loading={slotsLoading}
                    shopClosed={shopClosed}
                    onChange={setSelectedStart}
                  />
                </section>
              ) : null}
            </div>
          )}
        </div>

        {!confirming ? (
          <footer className="shrink-0 space-y-2 border-t border-zinc-800 px-4 py-3">
            <button
              type="button"
              disabled={!selectedStart || submitting}
              onClick={() => setConfirming(true)}
              className="w-full min-h-12 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              data-testid="reschedule-continue"
            >
              {t("booking.rescheduleContinue")}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="w-full min-h-11 rounded-xl text-sm text-zinc-400 disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
