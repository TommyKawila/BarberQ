"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { RescheduleFlow } from "@/components/customer/RescheduleFlow";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import {
  cancelBlockedDetailKey,
  cancelPageActions,
} from "@/lib/booking/cancel-page-actions";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";
import {
  CANCEL_LEAD_MINUTES,
  formatSlotTime,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface CancelClientProps {
  token: string;
  appointment: Appointment | null;
  barbers: Barber[];
  hours: ShopHours | null;
  shopSlug: string | null;
  lineUrl: string | null;
  phone: string | null;
}

function rescheduleBlockMessageKey(
  block: ReturnType<typeof cancelPageActions>["rescheduleBlock"],
): MessageKey | null {
  if (block === "used") return "booking.rescheduleUsed";
  if (block === "too_late") return "booking.rescheduleTooLate";
  return null;
}

export function CancelClient({
  token,
  appointment,
  barbers,
  hours,
  shopSlug,
  lineUrl,
  phone,
}: CancelClientProps) {
  const { locale, t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [current, setCurrent] = useState(appointment);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const shopHours = normalizeShopHours(hours);

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
      <section className="flex flex-col gap-4 px-4 py-8 break-keep">
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
  const { cancellable, reschedulable, rescheduleBlock } = cancelPageActions(current);
  const blockKey = rescheduleBlockMessageKey(rescheduleBlock);
  const canOpenReschedule = reschedulable && Boolean(shopSlug);

  const body = (
    <section className="flex flex-col gap-4 px-4 py-8 break-keep">
      <div className="rounded-2xl bg-zinc-900 p-5" data-testid="cancel-page-card">
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
            <dd className="text-lg font-semibold" data-testid="cancel-page-time">
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
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {canOpenReschedule ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setRescheduleOpen(true)}
                data-testid="cancel-page-reschedule"
                className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-40"
              >
                {t("booking.reschedule")}
              </button>
            ) : blockKey ? (
              <p className="text-sm text-zinc-400" data-testid="cancel-page-reschedule-blocked">
                {t(blockKey)}
              </p>
            ) : null}

            {cancellable ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void onCancel()}
                data-testid="cancel-page-cancel"
                className={
                  canOpenReschedule
                    ? "min-h-12 w-full rounded-xl border border-zinc-600 bg-transparent font-semibold text-zinc-200 disabled:opacity-40"
                    : "min-h-12 w-full rounded-xl bg-red-500 font-semibold text-white disabled:opacity-40"
                }
              >
                {submitting ? t("booking.cancelling") : t("booking.cancel")}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-amber-400" data-testid="cancel-blocked-detail">
                  {t(cancelBlockedDetailKey(current)).replace(
                    "{minutes}",
                    String(CANCEL_LEAD_MINUTES),
                  )}
                </p>
                <ShopContactLinks lineUrl={lineUrl} phone={phone} />
              </div>
            )}
          </div>
        )}
      </div>

      {rescheduleOpen && canOpenReschedule && shopSlug ? (
        <RescheduleFlow
          appointment={current}
          barbers={barbers}
          hours={shopHours}
          onClose={() => setRescheduleOpen(false)}
          onDone={(updated) => {
            setCurrent(updated);
            setRescheduleOpen(false);
            setMessage(null);
          }}
        />
      ) : null}
    </section>
  );

  if (!shopSlug) return body;
  return <ShopSlugProvider shopSlug={shopSlug}>{body}</ShopSlugProvider>;
}
