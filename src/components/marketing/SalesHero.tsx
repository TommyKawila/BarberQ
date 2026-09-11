"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";

const HERO_TRUST = [1, 2, 3] as const;

export function SalesHero() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-x-clip">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/marketing/barberqx/hero-barbershop-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center] md:object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-zinc-950/25 md:bg-gradient-to-r md:from-zinc-950 md:via-zinc-950/75 md:to-zinc-950/25" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 md:h-24" />
      </div>
      <MarketingNav />
      <section className="relative flex flex-col pb-6 pt-6 md:min-h-[640px] md:pb-8 lg:min-h-[680px] lg:pt-8">
        <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-6 px-4 lg:grid-cols-[48%_52%] lg:items-end lg:gap-10 lg:px-6">
          <div className="text-left">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 text-[2.5rem] font-bold leading-[1.15] md:text-[3.25rem] md:leading-[1.12] lg:text-[3.75rem]">
              {t("marketing.hero.titleLine1")}
              <br />
              {t("marketing.hero.titleLine2")}{" "}
              <span className="whitespace-nowrap text-amber-400">{t("marketing.hero.titleHighlight")}</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-300 md:text-lg">
              {t("marketing.hero.subtitle")}
              <br />
              {t("marketing.hero.subtitle2")}
            </p>
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
              <MarketingTrialLink className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950 md:w-auto">
                {t("marketing.hero.cta")}
              </MarketingTrialLink>
              <a
                href="#how-it-works"
                onClick={() => trackMarketingEvent("how_it_works_click")}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-500/80 px-6 py-3 font-medium text-zinc-200 md:w-auto"
              >
                {t("marketing.hero.secondary")}
              </a>
            </div>
            <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
              {HERO_TRUST.map((n) => (
                <li
                  key={n}
                  className="flex items-center gap-1.5 text-[13px] text-zinc-400 md:text-sm"
                >
                  <Check size={14} className="shrink-0 text-amber-400" strokeWidth={2.5} />
                  {t(`marketing.hero.trust${n}` as MessageKey)}
                </li>
              ))}
            </ul>
          </div>
          <div className="hero-phones-enter relative flex w-full items-end justify-center lg:justify-end">
            <div
              className="pointer-events-none absolute inset-[12%] rounded-full bg-amber-400/15 blur-3xl"
              aria-hidden
            />
            <Image
              src="/marketing/barberqx/hero-phone-hand.png"
              alt={t("marketing.hero.productAlt")}
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 767px) 92vw, (max-width: 1023px) 480px, 580px"
              className="relative h-auto w-[min(100%,390px)] object-contain drop-shadow-[0_20px_36px_rgba(0,0,0,0.4)] lg:w-[min(100%,580px)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
