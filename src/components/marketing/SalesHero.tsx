"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { HeroLineBookingAnim } from "@/components/marketing/mockups/HeroLineBookingAnim";
import { useI18n } from "@/lib/i18n/locale-provider";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";
import type { MessageKey } from "@/lib/i18n/dictionary";

export function SalesHero({
  heroCtaRef,
  heroCtaDesktopRef,
  initialScene,
}: {
  /** Mobile / tablet CTA block (<lg) for sticky-bar intersection. */
  heroCtaRef?: React.RefObject<HTMLDivElement | null>;
  /** Desktop CTA block (lg+) for sticky-bar intersection — same node as mobile when unified. */
  heroCtaDesktopRef?: React.RefObject<HTMLDivElement | null>;
  /** Optional forced scene (0–3) for SSR screenshots via ?heroScene= */
  initialScene?: number;
}) {
  const { t, locale } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;

  /** Design C: break after LINE so Thai “ไม่ต้อง…” stays intact (no mid-word wrap). */
  const mobileTitle = (() => {
    const title = t("marketing.hero.title");
    if (locale === "th") {
      const i = title.indexOf("LINE ");
      if (i >= 0) {
        return [title.slice(0, i + 4), title.slice(i + 5).trimStart()] as const;
      }
    } else {
      const i = title.indexOf("LINE — ");
      if (i >= 0) {
        return [title.slice(0, i + 6), title.slice(i + 7).trimStart()] as const;
      }
    }
    return null;
  })();

  const setCtaRefs = (node: HTMLDivElement | null) => {
    if (heroCtaRef) {
      (heroCtaRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    if (heroCtaDesktopRef) {
      (heroCtaDesktopRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    }
  };

  return (
    <>
      {/* Nav outside overflow-x-clip so position:sticky works on iOS/Safari */}
      <MarketingNav />
      <div className="relative max-w-full overflow-x-clip bg-zinc-950">
        {/* Desktop atmosphere plate */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <MarketingPhotoSlot
            slot="heroDesktop"
            alt=""
            priority
            fill
            sizes="100vw"
            objectPosition="right center"
            className="absolute inset-0 h-full w-full rounded-none border-0 opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.75) 38%, rgba(9,9,11,0.55) 55%, rgba(9,9,11,0.7) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-zinc-950/30" />
        </div>

        {/* Single hero DOM + single h1 — stacked on mobile, 2-col on lg+ */}
        <section className="relative max-w-full px-4 pb-8 pt-5 text-center lg:flex lg:min-h-[min(720px,100svh)] lg:flex-col lg:justify-center lg:pb-16 lg:pt-12 lg:text-left">
          <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-[1280px] flex-1 items-center gap-5 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] lg:gap-10 lg:px-2">
            <div className="relative z-10 min-w-0 max-w-full lg:max-w-[34rem]">
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.hero.eyebrow")}
              </p>
              <h1 className="mt-2 break-words text-[2.125rem] font-bold leading-[1.28] text-zinc-50 [word-break:keep-all] sm:text-[2.25rem] lg:mt-3 lg:text-[3.5rem] lg:leading-[1.2]">
                {/* Mobile: forced break after LINE; desktop: natural wrap */}
                <span className="lg:hidden">
                  {mobileTitle ? (
                    <>
                      {mobileTitle[0]}
                      <br />
                      {mobileTitle[1]}
                    </>
                  ) : (
                    t("marketing.hero.title")
                  )}
                </span>
                <span className="hidden lg:inline">{t("marketing.hero.title")}</span>
              </h1>
              <p className="mx-auto mt-3 max-w-full break-words text-[15px] leading-relaxed text-zinc-300 lg:mx-0 lg:mt-4 lg:text-lg lg:md:max-w-xl">
                <span className="lg:hidden">{t("marketing.hero.subtitleShort")}</span>
                <span className="hidden lg:inline">{t("marketing.hero.subtitle")}</span>
              </p>
              <div
                ref={setCtaRefs}
                className="relative mx-auto mt-5 w-full max-w-md lg:mx-0 lg:mt-6 lg:max-w-xl"
              >
                <div className="flex w-full items-stretch justify-center gap-2.5 lg:items-center lg:justify-start lg:gap-3">
                  <PrimaryTrialCta
                    labelKey="marketing.hero.cta"
                    placement="hero"
                    showRisk={false}
                    className="h-[52px] min-h-[52px] flex-1 justify-center px-4 py-0 text-center text-[15px] sm:text-base lg:h-auto lg:min-h-11 lg:w-auto lg:flex-none lg:justify-start lg:text-left"
                  />
                  {supportUrl ? (
                    <a
                      href={supportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackMarketingEvent("support_line_click", { cta_location: "hero" })
                      }
                      className="hidden min-h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-400 hover:text-zinc-50 lg:inline-flex"
                    >
                      {t("marketing.hero.secondary")}
                    </a>
                  ) : null}
                  <a
                    href="#try-booking"
                    onClick={() => trackMarketingEvent("how_it_works_click")}
                    className="inline-flex h-[52px] min-h-[52px] shrink-0 items-center justify-center rounded-xl border border-zinc-400/55 bg-transparent px-3.5 text-[15px] font-medium text-zinc-100 hover:border-zinc-300 hover:text-zinc-50 lg:hidden"
                  >
                    {t("marketing.hero.tryYourself")}
                  </a>
                </div>
                <p className="mt-3 text-center text-[13px] leading-snug text-zinc-300 sm:text-[13px] lg:text-left lg:text-sm">
                  {td("marketing.hero.underCta")}
                </p>
              </div>

              <p className="mt-3 max-w-full break-words text-sm leading-relaxed text-zinc-400">
                {td("marketing.hero.micro")}
              </p>

              {/* Single try-yourself control on desktop (mobile uses the secondary button above) */}
              <a
                href="#try-booking"
                onClick={() => trackMarketingEvent("how_it_works_click")}
                className="mt-4 hidden min-h-11 items-center text-[15px] font-medium text-amber-300 underline-offset-4 hover:underline lg:inline-flex"
              >
                {t("marketing.hero.tryYourself")}
              </a>
            </div>

            <div className="relative z-10 flex justify-center lg:justify-end lg:pr-4">
              <HeroLineBookingAnim
                className="w-full lg:max-w-[min(420px,46vw)]"
                initialScene={initialScene}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
