"use client";

import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { HeroProductMockups } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";

const HERO_TRUST = [1, 2, 3] as const;

export function SalesHero() {
  const { t } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));

  return (
    <div className="relative overflow-x-clip">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(244,183,64,0.16),transparent_50%),radial-gradient(ellipse_at_90%_20%,rgba(39,39,42,0.9),transparent_45%),linear-gradient(180deg,#0B0B0B_0%,#18181B_55%,#0B0B0B_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F4B740' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>
      <MarketingNav />
      <section className="relative flex flex-col pb-10 pt-6 md:min-h-[640px] md:pb-12 lg:min-h-[680px] lg:pt-8">
        <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-8 px-4 lg:grid-cols-[48%_52%] lg:items-center lg:gap-10 lg:px-6">
          <div className="text-left">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 text-[2.5rem] font-bold leading-[1.15] text-zinc-50 md:text-[3.25rem] md:leading-[1.12] lg:text-[3.75rem]">
              <span className="block text-amber-400">BarberQx</span>
              {t("marketing.hero.titleLine1")}
              <br />
              {t("marketing.hero.titleLine2")}{" "}
              <span className="whitespace-nowrap text-amber-400">
                {t("marketing.hero.titleHighlight")}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
              {t("marketing.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
              <MarketingTrialLink className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950 md:w-auto">
                {td("marketing.hero.cta")}
              </MarketingTrialLink>
              <a
                href="#how-it-works"
                onClick={() => trackMarketingEvent("how_it_works_click")}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-500/80 px-6 py-3 font-medium text-zinc-200 md:w-auto"
              >
                {t("marketing.hero.secondary")}
              </a>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {td("marketing.hero.ctaExpect")}
            </p>
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
          <div className="hero-phones-enter relative w-full" aria-label={t("marketing.hero.productAlt")}>
            <HeroProductMockups />
          </div>
        </div>
      </section>
    </div>
  );
}
