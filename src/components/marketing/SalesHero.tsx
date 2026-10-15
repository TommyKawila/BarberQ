"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { useI18n } from "@/lib/i18n/locale-provider";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";
import type { MessageKey } from "@/lib/i18n/dictionary";

export function SalesHero({
  heroCtaRef,
}: {
  heroCtaRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;

  return (
    <div className="relative max-w-full overflow-x-clip">
      {/*
        Desktop (lg+): full-bleed 16:9 — subject on right, left fade for copy.
      */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <MarketingPhotoSlot
          slot="heroDesktop"
          alt=""
          priority
          fill
          sizes="100vw"
          objectPosition="right center"
          className="absolute inset-0 h-full w-full rounded-none border-0"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #09090b 0%, #09090b 36%, rgba(9,9,11,0.96) 46%, rgba(9,9,11,0.72) 56%, rgba(9,9,11,0.28) 68%, transparent 82%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-zinc-950/35" />
      </div>

      <MarketingNav />
      <section className="relative flex min-h-[min(100svh,820px)] max-w-full flex-col pb-10 pt-6 lg:min-h-[min(720px,100svh)] lg:justify-center lg:pb-16 lg:pt-12">
        {/*
          Mobile / tablet: 4:5 hero under copy — headline sits on the dark top.
          Top gradient keeps type legible.
        */}
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <MarketingPhotoSlot
            slot="heroMobile"
            alt=""
            priority
            fill
            sizes="100vw"
            objectPosition="center top"
            className="absolute inset-0 h-full w-full rounded-none border-0"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(9,9,11,0.94) 0%, rgba(9,9,11,0.82) 18%, rgba(9,9,11,0.55) 36%, rgba(9,9,11,0.2) 52%, transparent 68%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-[1280px] flex-1 items-center gap-8 px-4 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)] lg:gap-10 lg:px-6">
          <div className="relative z-10 min-w-0 max-w-full text-left">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 break-words text-[1.75rem] font-bold leading-[1.3] text-zinc-50 sm:text-[2.25rem] md:text-[3.25rem] md:leading-[1.2] lg:text-[3.5rem]">
              {t("marketing.hero.title")}
            </h1>
            <p className="mt-4 max-w-full break-words text-base leading-relaxed text-zinc-300 md:max-w-xl md:text-lg">
              {t("marketing.hero.subtitle")}
            </p>
            <p className="mt-3 max-w-full text-sm font-medium text-amber-300/95 md:text-base">
              {t("marketing.hero.setup")}
            </p>

            <div ref={heroCtaRef} className="relative mt-6 max-w-full md:max-w-xl">
              <div className="relative flex w-full max-w-full flex-col gap-3">
                <PrimaryTrialCta
                  labelKey="marketing.hero.cta"
                  placement="hero"
                  fullWidth
                  className="sm:w-auto sm:min-w-[280px]"
                />
                {supportUrl ? (
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackMarketingEvent("support_line_click", { cta_location: "hero" })
                    }
                    className="box-border inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl border border-amber-500/50 bg-zinc-950/35 px-4 py-3 text-center font-medium text-amber-300 sm:w-auto sm:px-6"
                  >
                    {t("marketing.hero.secondary")}
                  </a>
                ) : (
                  <a
                    href="#how-it-works"
                    onClick={() => trackMarketingEvent("how_it_works_click")}
                    className="box-border inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl border border-zinc-400/50 bg-zinc-950/35 px-4 py-3 text-center font-medium text-zinc-100 sm:w-auto sm:px-6"
                  >
                    {t("marketing.hero.secondaryFallback")}
                  </a>
                )}
              </div>
            </div>

            <p className="mt-3 max-w-full break-words text-sm leading-relaxed text-zinc-400">
              {td("marketing.hero.micro")}
            </p>
          </div>

          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>
    </div>
  );
}
