"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import liff from "@line/liff";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import { sortAppointmentsUpcomingFirst } from "@/lib/booking/customer-flow";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import {
  canCancelAt,
  formatSlotTime,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type AppointmentStatus, type Barber } from "@/types/booking";
import type { MessageKey } from "@/lib/i18n/dictionary";

interface ApiError {
  error?: { message?: string };
}

function statusLabel(status: AppointmentStatus, t: (key: MessageKey) => string): string {
  switch (status) {
    case "confirmed":
      return t("booking.statusConfirmed");
    case "cancelled":
      return t("booking.statusCancelled");
    case "completed":
      return t("booking.statusCompleted");
    case "no_show":
      return t("booking.statusNoShow");
    default:
      return status;
  }
}

export default function MyBookingsPage() {
  const { locale, t } = useI18n();
  const { ready, profile, login, mockMode } = useLineAuth();
  const { shopApi, shopPath } = useShopSlug();
  const { shopName, lineUrl, phone: shopPhone } = useShopBrand();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const addFriendUrl = process.env.NEXT_PUBLIC_LINE_OA_ADD_URL?.trim() ?? "";

  useEffect(() => {
    if (!ready || !profile) return;
    let cancelled = false;
    void (async () => {
      const [bookingsRes, barbersRes] = await Promise.all([
        fetch(shopApi("/bookings"), {
          headers: getLineAuthHeaders(mockMode ? profile.userId : undefined),
        }),
        fetch(shopApi("/barbers")),
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
  }, [ready, profile, shopApi, mockMode]);

  useEffect(() => {
    if (!ready || mockMode || !addFriendUrl) {
      setShowAddFriend(false);
      return;
    }
    let cancelled = false;
    void liff
      .getFriendship()
      .then((result) => {
        if (!cancelled) setShowAddFriend(!result.friendFlag);
      })
      .catch(() => {
        if (!cancelled) setShowAddFriend(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, mockMode, addFriendUrl]);

  const sortedAppointments = useMemo(
    () => sortAppointmentsUpcomingFirst(appointments),
    [appointments],
  );

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
    <div className="flex flex-col gap-4 px-4 py-8 pb-24">
      <header>
        <h1 className="text-2xl font-semibold">{t("booking.myBookings")}</h1>
        {shopName ? <p className="text-sm text-zinc-400">{shopName}</p> : null}
      </header>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}

      {sortedAppointments.length === 0 ? (
        <p className="text-center text-zinc-500">{t("booking.noBookings")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedAppointments.map((apt) => {
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
                {shopName ? <p className="text-xs text-zinc-500">{shopName}</p> : null}
                <h3 className="font-semibold">
                  {barber ? barberLabel(barber.name, locale) : "—"}
                </h3>
                <p className="text-sm text-zinc-400">{dateLabel}</p>
                <p className="text-lg font-semibold">
                  {formatSlotTime(apt.start_time)} – {formatSlotTime(apt.end_time)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{statusLabel(apt.status, t)}</p>
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

      {showAddFriend && addFriendUrl ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">{t("booking.addFriendSecondary")}</p>
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex min-h-11 items-center justify-center rounded-lg bg-[#06C755] text-sm font-semibold text-white"
          >
            {t("booking.addBarberqFriend")}
          </a>
        </div>
      ) : null}

      <Link
        href={shopPath("/")}
        className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-amber-400 text-center text-sm font-semibold text-zinc-950"
      >
        {t("booking.bookAnother")}
      </Link>
    </div>
  );
}
