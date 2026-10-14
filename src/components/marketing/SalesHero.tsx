"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";

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
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(244,183,64,0.14),transparent_50%),radial-gradient(ellipse_at_90%_20%,rgba(39,39,42,0.85),transparent_45%),linear-gradient(180deg,#0B0B0B_0%,#18181B_55%,#0B0B0B_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F4B740' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Desktop: placeholder photo plane on the right + soft left fade */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <div className="absolute inset-y-0 right-0 w-[72%] lg:w-[68%]">
          <MarketingPhotoSlot
            slot="heroHandPhone"
            alt=""
            priority
            sizes="(min-width: 1024px) 68vw, 72vw"
            className="h-full min-h-[640px] rounded-none border-0 border-l border-dashed border-amber-500/25"
          />
        </div>
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
            <h1 className="mt-3 break-words text-[1.75rem] font-bold leading-[1.3] text-zinc-50 sm:text-[2.25rem] md:text-[3.25rem] md:leading-[1.2] lg:text-[3.5rem]">
              {t("marketing.hero.title")}
            </h1>
            <p className="mt-4 max-w-full break-words text-base leading-relaxed text-zinc-300 md:max-w-xl md:text-lg">
              {t("marketing.hero.subtitle")}
            </p>

            <div ref={heroCtaRef} className="relative mt-8 max-w-full md:max-w-xl">
              <div className="relative flex w-full max-w-full flex-col gap-3 md:flex-row md:items-center">
                <MarketingTrialLink
                  placement="hero"
                  className="box-border inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3 text-center font-semibold text-zinc-950 sm:px-6 md:w-auto"
                >
                  {td("marketing.hero.cta")}
                </MarketingTrialLink>
                {supportUrl ? (
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackMarketingEvent("support_line_click", { cta_location: "hero" })
                    }
                    className="box-border inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl border border-amber-500/50 bg-zinc-950/35 px-4 py-3 text-center font-medium text-amber-300 sm:px-6 md:w-auto"
                  >
                    {t("marketing.hero.secondary")}
                  </a>
                ) : (
                  <a
                    href="#how-it-works"
                    onClick={() => trackMarketingEvent("how_it_works_click")}
                    className="box-border inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl border border-zinc-400/50 bg-zinc-950/35 px-4 py-3 text-center font-medium text-zinc-100 sm:px-6 md:w-auto"
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

          <div className="hidden md:block" aria-hidden />

          {/* Mobile: placeholder product visual (swap via photo-slots.ts) */}
          <div
            className="hero-phones-enter relative w-full min-w-0 max-w-full md:hidden"
            aria-label={t("marketing.hero.productAlt")}
          >
            <div className="relative -mx-4 w-[calc(100%+2rem)] max-w-none">
              <MarketingPhotoSlot
                slot="heroHandPhone"
                alt={t("marketing.hero.productAlt")}
                priority
                sizes="100vw"
                className="mx-auto min-h-[420px] max-w-md"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
