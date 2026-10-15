"use client";

import Image from "next/image";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import { BarberAvatar } from "@/components/barber/BarberAvatar";
import { shouldShowLineReminder, type LineFriendship } from "@/lib/booking/booking-success-ux";
import { customerBarberPhotoUrl } from "@/lib/barber/barber-avatar";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { reminderDisplayMessageKey } from "@/lib/reminders/display";
import { formatSlotTime, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { Appointment, Barber } from "@/types/booking";

function barberDisplayName(raw: string, locale: "th" | "en", labelTemplate: string): string {
  const name = raw.trim();
  if (!name) return name;
  if (locale === "th" && name.startsWith("ช่าง")) return name;
  if (locale === "en" && /^barber\s+/i.test(name)) return name;
  // Strip bilingual "นัท · Nat" style labels down to the Thai given name
  const thaiOnly = name.split(/[·•\-–—]/)[0]?.trim() ?? name;
  return labelTemplate.replace("{name}", thaiOnly);
}

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
  const whoLabel = barberDisplayName(
    barber?.name ?? barberName,
    locale,
    t("booking.successBarberLabel"),
  );
  const reminderKey = reminderDisplayMessageKey(appointment.reminder_lead_minutes);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 py-6">
      {/* Peak-end success signal — stage spotlight chair (asset includes beam/sparkles/check) */}
      <header className="text-center">
        <div className="booking-success-chair relative mx-auto flex h-[220px] w-full max-w-[280px] items-end justify-center sm:h-[240px]">
          <div
            className="pointer-events-none absolute bottom-[8%] left-1/2 h-12 w-[62%] -translate-x-1/2 rounded-[100%] bg-amber-300/20 blur-2xl"
            aria-hidden
          />
          <Image
            src="/images/booking-success-chair.webp"
            alt=""
            width={230}
            height={230}
            priority
            className="relative z-[1] mx-auto h-auto w-[176px] object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.6)] sm:w-[196px] md:w-[208px]"
          />
        </div>

        <h1 className="mt-3 text-[1.65rem] font-bold leading-snug tracking-tight text-zinc-50 sm:text-2xl">
          {t("booking.successTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("booking.successSubtitle")}</p>
        <p className="mt-1 text-sm text-zinc-500">{t("booking.successSeeYou")}</p>
      </header>

      {/* Who / when / where — reduces post-booking anxiety */}
      <section className="rounded-2xl border border-amber-500/20 bg-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)]">
        {shopName ? (
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t("booking.successWhereLabel")}
            </p>
            <p className="text-right text-sm font-semibold text-zinc-100">{shopName}</p>
          </div>
        ) : null}

        <div className={`${shopName ? "mt-3 border-t border-zinc-800 pt-3" : ""} flex items-center gap-3`}>
          <BarberAvatar name={barber?.name ?? barberName} imageUrl={photoUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-50">{whoLabel}</p>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("booking.successWhenLabel")}
          </p>
          <p className="mt-1 text-sm text-zinc-300">{dateLabel}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-amber-300">
            {formatSlotTime(appointment.start_time)}
          </p>
          {barber ? (
            <p className="mt-1 text-sm text-zinc-500">
              {barber.slot_duration_minutes} {t("common.minutes")}
            </p>
          ) : null}
        </div>

        {reminderKey ? (
          <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-400/5 px-3 py-2 text-sm text-amber-100">
            {t("booking.reminderChosen").replace("{lead}", t(reminderKey as MessageKey))}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t("booking.successNextHint")}</p>
        )}
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

      {/* Single clear next action */}
      <div className="flex flex-col gap-2">
        <Link
          href={shopPath("/bookings")}
          className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 text-base font-bold text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {t("booking.viewMyBookings")}
        </Link>
        <button
          type="button"
          onClick={onBackToShop}
          className="min-h-11 rounded-xl text-sm font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {t("booking.backToShop")}
        </button>
      </div>
    </div>
  );
}
