"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  canCancelAt,
  formatSlotTime,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber } from "@/types/booking";

interface ApiError {
  error?: { message?: string };
}

export default function MyBookingsPage() {
  const { locale, t } = useI18n();
  const { ready, profile, login, mockMode } = useLineAuth();
  const { lineUrl, phone: shopPhone } = useShopBrand();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !profile) return;
    let cancelled = false;
    void (async () => {
      const [bookingsRes, barbersRes] = await Promise.all([
        fetch(`/api/bookings?lineId=${encodeURIComponent(profile.userId)}`),
        fetch("/api/barbers"),
      ]);
      if (cancelled) return;
      const bookingsJson = (await bookingsRes.json()) as { appointments?: Appointment[] };
      const barbersJson = (await barbersRes.json()) as { barbers?: Barber[] };
      setAppointments(bookingsJson.appointments ?? []);
      setBarbers(barbersJson.barbers ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, profile]);

  async function handleCancel(apt: Appointment) {
    if (!apt.cancel_token) return;
    setSubmittingId(apt.id);
    setMessage(null);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: apt.cancel_token }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setMessage(json.error?.message ?? t("booking.cancelFailed"));
        return;
      }
      setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
    } catch {
      setMessage(t("booking.cancelFailed"));
    } finally {
      setSubmittingId(null);
    }
  }

  const dateLocale = locale === "th" ? th : enUS;

  if (!ready || loading) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (!profile && !mockMode) {
    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("booking.myBookings")}</h1>
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

  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("booking.myBookings")}</h1>
        {profile.displayName ? (
          <p className="text-sm text-zinc-400">{profile.displayName}</p>
        ) : null}
      </header>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}

      {appointments.length === 0 ? (
        <p className="text-center text-zinc-500">{t("booking.noBookings")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((apt) => {
            const barber = barbers.find((b) => b.id === apt.barber_id);
            const cancellable = canCancelAt(apt.start_time) && apt.status === "confirmed";
            const dateLabel = formatInTimeZone(
              new Date(apt.start_time),
              SHOP_TIMEZONE,
              "EEEE d MMM yyyy",
              { locale: dateLocale },
            );

            return (
              <div key={apt.id} className="rounded-xl bg-zinc-900 p-4">
                <h3 className="font-semibold">
                  {barber ? barberLabel(barber.name, locale) : "—"}
                </h3>
                <p className="text-sm text-zinc-400">{dateLabel}</p>
                <p className="text-lg font-semibold">
                  {formatSlotTime(apt.start_time)} – {formatSlotTime(apt.end_time)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">{apt.customer_name}</p>
                {cancellable && apt.cancel_token ? (
                  <button
                    type="button"
                    disabled={submittingId === apt.id}
                    onClick={() => void handleCancel(apt)}
                    className="mt-3 w-full min-h-11 rounded-lg bg-red-500 text-sm font-semibold disabled:opacity-50"
                  >
                    {submittingId === apt.id ? t("booking.cancelling") : t("booking.cancel")}
                  </button>
                ) : apt.status === "confirmed" ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-amber-400">{t("booking.cancelTooLate")}</p>
                    <ShopContactLinks lineUrl={lineUrl} phone={shopPhone} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Link href="/" className="mt-4 text-center text-sm text-amber-400 underline">
        {t("booking.bookAnother")}
      </Link>
    </div>
  );
}
