"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta, RiskReversalRow } from "@/components/marketing/PrimaryTrialCta";
import { useI18n } from "@/lib/i18n/locale-provider";
import { fillOfferCopy } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";
import type { MessageKey } from "@/lib/i18n/dictionary";

export function SalesHero({
  heroCtaRef,
  heroCtaDesktopRef,
}: {
  /** Mobile / tablet CTA block (<lg) for sticky-bar intersection. */
  heroCtaRef?: React.RefObject<HTMLDivElement | null>;
  /** Desktop CTA block (lg+) for sticky-bar intersection. */
  heroCtaDesktopRef?: React.RefObject<HTMLDivElement | null>;
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

  return (
    <>
      {/* Nav outside overflow-x-clip so position:sticky works on iOS/Safari */}
      <MarketingNav />
      <div className="relative max-w-full overflow-x-clip bg-zinc-950">
      {/*
        Desktop (lg+): full-bleed — subject on right, left fade for copy.
        Locked (Tommy hero-composite). Do not change.
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
              "linear-gradient(to right, rgba(9,9,11,0.55) 0%, rgba(9,9,11,0.28) 28%, rgba(9,9,11,0.08) 42%, transparent 52%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-zinc-950/25" />
      </div>

      {/*
        Mobile / tablet (<lg): design C — flat zinc-950, text then CTAs then photo.
        Never place the photo behind type.
        object-position nudged ~10% toward bottom so wrist stays in frame.
      */}
      <section className="relative max-w-full px-4 pb-8 pt-5 lg:hidden">
        <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
        <h1 className="mt-2 text-[2.125rem] font-bold leading-[1.28] text-zinc-50 [word-break:keep-all] sm:text-[2.25rem]">
          {mobileTitle ? (
            <>
              {mobileTitle[0]}
              <br />
              {mobileTitle[1]}
            </>
          ) : (
            t("marketing.hero.title")
          )}
        </h1>
        <p className="mt-3 max-w-full break-words text-[15px] leading-relaxed text-zinc-300">
          {t("marketing.hero.subtitleShort")}
        </p>

        <div ref={heroCtaRef} className="relative mt-5 max-w-full">
          <div className="flex w-full items-stretch gap-2.5">
            <PrimaryTrialCta
              labelKey="marketing.hero.cta"
              placement="hero"
              showRisk={false}
              className="h-[52px] min-h-[52px] flex-1 justify-center px-4 py-0 text-center text-[15px] sm:text-base"
            />
            {/* Design C always shows “ดูวิธีทำงาน” — not the support LINE label */}
            <a
              href="#try-booking"
              onClick={() => trackMarketingEvent("how_it_works_click")}
              className="inline-flex h-[52px] min-h-[52px] shrink-0 items-center justify-center rounded-xl border border-zinc-400/55 bg-transparent px-3.5 text-[15px] font-medium text-zinc-100 hover:border-zinc-300 hover:text-zinc-50"
            >
              {t("marketing.hero.secondaryFallback")}
            </a>
          </div>
          <RiskReversalRow className="mt-3 justify-start gap-x-3 text-[13px] sm:justify-start" />
        </div>

        <div className="relative mt-5 h-[45vh] max-h-[45vh] w-full overflow-hidden rounded-2xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-gradient-to-b from-zinc-950/90 to-transparent"
            aria-hidden
          />
          <MarketingPhotoSlot
            slot="heroMobile"
            alt=""
            priority
            fill
            sizes="(max-width: 1023px) 100vw, 0px"
            objectPosition="center 60%"
            className="h-full w-full rounded-2xl"
          />
        </div>

        <p className="mt-4 max-w-full break-words text-sm leading-relaxed text-zinc-400">
          {td("marketing.hero.micro")}
        </p>
        <p className="mt-2 max-w-full text-sm font-medium text-amber-300/95">
          {t("marketing.hero.setup")}
        </p>
      </section>

      {/* Desktop copy column locked (Tommy): stays on dark left of hero-composite */}
      <section className="relative hidden min-h-[min(720px,100svh)] max-w-full flex-col justify-center pb-16 pt-12 lg:flex">
        <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-[1280px] flex-1 items-center gap-8 px-4 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:gap-8 lg:px-6">
          <div className="relative z-10 min-w-0 max-w-full text-left lg:max-w-[34rem]">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 break-words text-[3.5rem] font-bold leading-[1.2] text-zinc-50">
              {t("marketing.hero.title")}
            </h1>
            <p className="mt-4 max-w-full break-words text-lg leading-relaxed text-zinc-300 md:max-w-xl">
              {t("marketing.hero.subtitle")}
            </p>
            <p className="mt-3 max-w-full text-base font-medium text-amber-300/95">
              {t("marketing.hero.setup")}
            </p>

            <div ref={heroCtaDesktopRef} className="relative mt-6 max-w-full md:max-w-xl">
              <div className="flex w-full flex-row items-center gap-3">
                <PrimaryTrialCta
                  labelKey="marketing.hero.cta"
                  placement="hero"
                  showRisk={false}
                  className="w-auto justify-start text-left"
                />
                {supportUrl ? (
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackMarketingEvent("support_line_click", { cta_location: "hero" })
                    }
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-400 hover:text-zinc-50"
                  >
                    {t("marketing.hero.secondary")}
                  </a>
                ) : (
                  <a
                    href="#try-booking"
                    onClick={() => trackMarketingEvent("how_it_works_click")}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-400 hover:text-zinc-50"
                  >
                    {t("marketing.hero.secondaryFallback")}
                  </a>
                )}
              </div>
              <RiskReversalRow />
            </div>

            <p className="mt-3 max-w-full break-words text-sm leading-relaxed text-zinc-400">
              {td("marketing.hero.micro")}
            </p>
          </div>

          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>
      </div>
    </>
  );
}
