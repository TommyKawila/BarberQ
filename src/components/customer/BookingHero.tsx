"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { bookingShopTitle } from "@/lib/booking/customer-flow";

interface BookingHeroProps {
  shopName: string | null;
  coverImageUrl: string | null;
  prototypeMode?: boolean;
}

export function BookingHero({ shopName, coverImageUrl, prototypeMode }: BookingHeroProps) {
  const { t } = useI18n();
  const resolvedShopName = bookingShopTitle(shopName);
  const displayName = resolvedShopName ?? t("booking.title");

  return (
    <header className="relative overflow-hidden rounded-2xl">
      <div className="relative h-40 w-full sm:h-44">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- shop cover from storage
          <img
            src={coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-end p-4">
          {prototypeMode ? (
            <span className="mb-2 inline-block w-fit rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-300">
            {t("booking.shopTitleEyebrow")}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold leading-tight text-white break-words">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-300">{t("booking.shopSubtitle")}</p>
        </div>
      </div>
    </header>
  );
}
