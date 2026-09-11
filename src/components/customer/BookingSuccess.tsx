"use client";

import Image from "next/image";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { BarberAvatar } from "@/components/barber/BarberAvatar";
import { shouldShowLineReminder, type LineFriendship } from "@/lib/booking/booking-success-ux";
import { customerBarberPhotoUrl } from "@/lib/barber/barber-avatar";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { Appointment, Barber } from "@/types/booking";

export function BookingSuccess({
  appointment,
  barberName,
  shopName,
  barber,
  friendship,
  onBackToShop,
}: {
  appointment: Appointment;
  barberName: string;
  shopName: string | null;
  barber: Barber | null;
  friendship: LineFriendship;
  onBackToShop: () => void;
}) {
  const { t, locale } = useI18n();
  const { shopPath } = useShopSlug();
  const addFriendUrl = process.env.NEXT_PUBLIC_LINE_OA_ADD_URL?.trim() ?? "";
  const showLine = shouldShowLineReminder(addFriendUrl, friendship);
  const dateLabel = formatInTimeZone(
    new Date(appointment.start_time),
    SHOP_TIMEZONE,
    "EEEE d MMMM yyyy",
    { locale: locale === "th" ? th : enUS },
  );
  const photoUrl = barber ? customerBarberPhotoUrl(barber) : null;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-6">
      <header className="text-center">
        <div className="booking-success-chair relative mx-auto w-fit">
          <div
            className="pointer-events-none absolute inset-[12%] rounded-full bg-amber-400/15 blur-2xl"
            aria-hidden
          />
          <Image
            src="/images/booking-success-chair.png"
            alt=""
            width={230}
            height={230}
            priority
            className="relative mx-auto h-auto w-[180px] object-contain sm:w-[200px] md:w-[220px]"
          />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-50">{t("booking.successTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t("booking.successSubtitle")}</p>
        <p className="mt-1 text-sm text-zinc-500">{t("booking.successSeeYou")}</p>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        {shopName ? <p className="text-sm font-semibold text-zinc-100">{shopName}</p> : null}
        <div className="mt-3 flex items-center gap-3">
          <BarberAvatar name={barber?.name ?? barberName} imageUrl={photoUrl} size="sm" />
          <p className="text-sm text-zinc-300">{barberName}</p>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{dateLabel}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
          {formatSlotTime(appointment.start_time)}
        </p>
        {barber ? (
          <p className="mt-1 text-sm text-zinc-500">
            {barber.slot_duration_minutes} {t("common.minutes")}
          </p>
        ) : null}
      </section>

      {showLine ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">{t("booking.successReminderTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {t("booking.successReminderBody")}
          </p>
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t("booking.successAddFriend")}
            className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#06C755] text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("booking.successAddFriend")}
          </a>
          <p className="mt-2 text-center text-xs text-zinc-500">{t("booking.successReminderHint")}</p>
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        <Link
          href={shopPath("/bookings")}
          className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {t("booking.viewMyBookings")}
        </Link>
        <button
          type="button"
          onClick={onBackToShop}
          className="min-h-12 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {t("booking.backToShop")}
        </button>
      </div>
    </div>
  );
}
