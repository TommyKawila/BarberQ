"use client";

import Image from "next/image";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { HeroProductMockups } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";
import { handPhoneHero } from "@/lib/marketing/screens";

export function SalesHero() {
  const { t } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));

  return (
    <div className="relative max-w-full overflow-x-clip">
      {/* Mobile-only atmosphere (product photo stays in the column below) */}
      <div className="absolute inset-0 overflow-hidden md:hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(244,183,64,0.16),transparent_50%),radial-gradient(ellipse_at_90%_20%,rgba(39,39,42,0.9),transparent_45%),linear-gradient(180deg,#0B0B0B_0%,#18181B_55%,#0B0B0B_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F4B740' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/*
        Desktop: FULL rectangular hand-phone photo (real barbershop scene — no oval cutout),
        anchored to the RIGHT edge so the booking screen is clearly visible.
        Soft zinc-950 → photo fade on the left for headline + CTAs (no hard edge).
      */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {/* Photo runs under the fade zone (wide right panel) so there is no hard panel edge */}
        <div className="absolute inset-y-0 right-0 w-[72%] lg:w-[68%]">
          <Image
            src={handPhoneHero.composited}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 68vw, 72vw"
            className="object-cover object-[58%_36%]"
          />
        </div>
        {/* Soft zinc-950 → photo fade over the left of the image */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #09090b 0%, #09090b 38%, rgba(9,9,11,0.94) 48%, rgba(9,9,11,0.7) 56%, rgba(9,9,11,0.28) 64%, transparent 76%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-zinc-950/35" />
      </div>

      <MarketingNav />
      <section className="relative flex max-w-full flex-col pb-10 pt-6 md:min-h-[640px] md:pb-14 lg:min-h-[720px] lg:pt-10">
        <div className="mx-auto grid w-full min-w-0 max-w-[1280px] flex-1 items-center gap-8 px-4 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)] lg:items-center lg:gap-10 lg:px-6">
          <div className="relative z-10 min-w-0 max-w-full text-left">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 break-words text-[2rem] font-bold leading-[1.2] text-zinc-50 sm:text-[2.25rem] md:text-[3.25rem] md:leading-[1.15] lg:text-[3.5rem]">
              {t("marketing.hero.title")}
            </h1>
            <p className="mt-4 max-w-full break-words text-base leading-relaxed text-zinc-300 md:max-w-xl md:text-lg">
              {t("marketing.hero.subtitle")}
            </p>

            <div className="relative mt-8 max-w-full md:max-w-xl">
              <div className="relative flex w-full max-w-full flex-col gap-3 md:flex-row md:items-center">
                <MarketingTrialLink className="box-border inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3 text-center font-semibold text-zinc-950 sm:px-6 md:w-auto">
                  {td("marketing.hero.cta")}
                </MarketingTrialLink>
                <a
                  href="#how-it-works"
                  onClick={() => trackMarketingEvent("how_it_works_click")}
                  className="box-border inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl border border-zinc-400/50 bg-zinc-950/35 px-4 py-3 text-center font-medium text-zinc-100 sm:px-6 md:w-auto"
                >
                  {t("marketing.hero.secondary")}
                </a>
              </div>
            </div>

            <p className="mt-3 max-w-full break-words text-sm leading-relaxed text-zinc-400">
              {td("marketing.hero.micro")}
            </p>
          </div>

          {/* Desktop visual is the right-anchored full-bleed photo above */}
          <div className="hidden md:block" aria-hidden />

          {/* Mobile: unchanged large hand-phone product visual */}
          <div
            className="hero-phones-enter relative w-full min-w-0 max-w-full md:hidden"
            aria-label={t("marketing.hero.productAlt")}
          >
            <HeroProductMockups />
          </div>
        </div>
      </section>
    </div>
  );
}
