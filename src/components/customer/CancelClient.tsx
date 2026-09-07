"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import { useI18n } from "@/lib/i18n/locale-provider";
import { canCancelAt, formatSlotTime, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface CancelClientProps {
  token: string;
  appointment: Appointment | null;
  barbers: Barber[];
  lineUrl: string | null;
  phone: string | null;
}

export function CancelClient({
  token,
  appointment,
  barbers,
  lineUrl,
  phone,
}: CancelClientProps) {
  const { locale, t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [current, setCurrent] = useState(appointment);

  async function onCancel() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: token }),
      });
      const json = (await res.json()) as { appointment?: Appointment } & ApiError;
      if (!res.ok || !json.appointment) {
        setMessage(json.error?.message ?? t("booking.cancelFailed"));
        return;
      }
      setCurrent(json.appointment);
    } catch {
      setMessage(t("booking.cancelFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!current) {
    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        <h1 className="text-xl font-semibold">{t("cancel.title")}</h1>
        <p className="text-sm text-zinc-400">{t("cancel.notFound")}</p>
        <ShopContactLinks lineUrl={lineUrl} phone={phone} />
      </section>
    );
  }

  const barber = barbers.find((item) => item.id === current.barber_id);
  const dateLocale = locale === "th" ? th : enUS;
  const dateLabel = formatInTimeZone(new Date(current.start_time), SHOP_TIMEZONE, "EEEE d MMM yyyy", {
    locale: dateLocale,
  });
  const cancelled = current.status === "cancelled";
  const cancellable = current.status === "confirmed" && canCancelAt(current.start_time);

  return (
    <section className="flex flex-col gap-4 px-4 py-8">
      <div className="rounded-2xl bg-zinc-900 p-5">
        <h1 className="text-xl font-semibold">
          {cancelled ? t("cancel.done") : t("cancel.title")}
        </h1>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">{t("booking.barber")}</dt>
            <dd className="font-medium">{barber ? barberLabel(barber.name, locale) : "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("booking.date")}</dt>
            <dd>{dateLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("booking.time")}</dt>
            <dd className="text-lg font-semibold">
              {formatSlotTime(current.start_time)} – {formatSlotTime(current.end_time)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("booking.name")}</dt>
            <dd>{current.customer_name}</dd>
          </div>
        </dl>
        {message ? <p className="mt-4 text-sm text-red-400">{message}</p> : null}
        {cancelled ? (
          <p className="mt-4 text-sm text-zinc-400">{t("cancel.alreadyCancelled")}</p>
        ) : cancellable ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void onCancel()}
            className="mt-5 min-h-12 w-full rounded-xl bg-red-500 font-semibold text-white disabled:opacity-40"
          >
            {submitting ? t("booking.cancelling") : t("booking.cancel")}
          </button>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-amber-400">{t("booking.cancelTooLate")}</p>
            <ShopContactLinks lineUrl={lineUrl} phone={phone} />
          </div>
        )}
      </div>
    </section>
  );
}
