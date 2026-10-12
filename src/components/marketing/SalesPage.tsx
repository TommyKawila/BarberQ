"use client";

import { useEffect } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  MessageCircle,
  MessageCircleOff,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { SalesHero } from "@/components/marketing/SalesHero";
import { CustomerStepPhone } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { OwnerSurfacePhone } from "@/components/marketing/mockups/OwnerSurfacesMockups";
import { PainChatMockup } from "@/components/marketing/mockups/PainChatMockup";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import {
  fillOfferCopy,
  formatBaht,
  marketingOffer,
  tierBarberRangeLabel,
  tierPricePerMonthLabel,
} from "@/lib/marketing/offer";

const HOW_ICONS = [MessageCircle, CalendarClock, CircleCheck] as const;
const FEATURE_ICONS = [
  MessageCircleOff,
  Clock3,
  Users,
  Store,
  Smartphone,
  CalendarClock,
] as const;
const COMING_ICONS = [Store, Bell] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7] as const;
const BODY = "text-[15px] leading-relaxed text-zinc-300 md:text-base";
/** Keep testimonials out of the live page until real quotes exist. */
const SHOW_TESTIMONIALS_PLACEHOLDER = false;

function TrialCta({
  label,
  className,
  fullWidth,
}: {
  label: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <MarketingTrialLink
      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950 ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
    >
      {label}
    </MarketingTrialLink>
  );
}

function ContactCta({ label, className }: { label: string; className?: string }) {
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  if (!supportUrl) {
    return (
      <TrialCta label={label} className={className} fullWidth />
    );
  }
  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMarketingEvent("support_line_click")}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-500/50 bg-transparent px-6 py-3 font-semibold text-amber-300 hover:bg-amber-500/10 ${className ?? ""}`}
    >
      {label}
    </a>
  );
}

export function SalesPage() {
  const { t, locale } = useI18n();

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  const painMessages = [
    t("marketing.pain.chat1"),
    t("marketing.pain.chat2"),
    t("marketing.pain.chat3"),
    t("marketing.pain.chat4"),
  ];

  const td = (key: MessageKey) => fillOfferCopy(t(key));

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <LiffCallbackRedirect />
      <AttributionCapture />
      <SalesHero />

      {/* Pain */}
      <section className="overflow-x-clip bg-zinc-900/40">
        <div className="mx-auto grid max-w-[1280px] items-center gap-6 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,54%)_minmax(0,46%)] lg:gap-10">
          <div>
            <h2 className="text-[1.75rem] font-bold leading-[1.2] text-zinc-50 md:text-4xl lg:text-[2.5rem]">
              {t("marketing.pain.titleLine1")}
              <br />
              {t("marketing.pain.titleLine2")}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 md:text-base">
              {t("marketing.pain.supportQuotes")}
            </p>
            <p className={`mt-2 ${BODY}`}>{t("marketing.pain.support")}</p>
            <p className="mt-4 text-sm text-amber-400/90">{t("marketing.pain.emphasis")}</p>
          </div>
          <PainChatMockup messages={painMessages} footer={t("marketing.pain.visualFooter")} />
        </div>
      </section>

      {/* 3 steps */}
      <section id="how-it-works" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium text-amber-400/90">{t("marketing.how.eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.how.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{t("marketing.how.support")}</p>
          <ol className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-6">
            {([1, 2, 3] as const).map((n) => {
              const Icon = HOW_ICONS[n - 1];
              return (
                <li key={n} className="flex flex-col items-center text-center">
                  <span className="flex items-center gap-2 text-xl font-bold tabular-nums text-amber-400 lg:text-3xl">
                    <Icon size={22} className="shrink-0" strokeWidth={2} />
                    {String(n).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-zinc-50">
                    {t(`marketing.how.${n}.title` as MessageKey)}
                  </h3>
                  <p className={`mt-1.5 ${BODY}`}>
                    {t(`marketing.how.${n}.desc` as MessageKey)}
                  </p>
                  <div className="mt-5">
                    <CustomerStepPhone step={n} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 6 features */}
      <section id="features" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.features.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.features.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{t("marketing.features.support")}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {([1, 2, 3, 4, 5, 6] as const).map((n) => {
              const Icon = FEATURE_ICONS[n - 1];
              return (
                <li
                  key={n}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 md:p-6"
                >
                  <Icon size={22} className="text-amber-400" strokeWidth={2} />
                  <h3 className="mt-3 text-lg font-semibold text-zinc-50">
                    {t(`marketing.features.${n}.title` as MessageKey)}
                  </h3>
                  <p className={`mt-2 ${BODY}`}>
                    {t(`marketing.features.${n}.desc` as MessageKey)}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
            <OwnerSurfacePhone surface="queue" />
            <OwnerSurfacePhone surface="team" />
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section id="coming-soon" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.coming.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.coming.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{t("marketing.coming.support")}</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {([1, 2] as const).map((n) => {
              const Icon = COMING_ICONS[n - 1];
              return (
                <li
                  key={n}
                  className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-5 md:p-6"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={20} className="text-zinc-500" strokeWidth={2} />
                    <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      {t("marketing.coming.badge")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-200">
                    {t(`marketing.coming.${n}.title` as MessageKey)}
                  </h3>
                  <p className={`mt-2 ${BODY}`}>
                    {t(`marketing.coming.${n}.desc` as MessageKey)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Testimonials placeholder — hidden until real reviews exist */}
      {SHOW_TESTIMONIALS_PLACEHOLDER ? (
        <section
          id="testimonials"
          className="scroll-mt-20 overflow-x-clip bg-zinc-900/30"
          aria-hidden
        >
          <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6">
            <p className="text-sm font-medium text-zinc-500">
              {t("marketing.testimonials.placeholder")}
            </p>
          </div>
        </section>
      ) : null}

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.pricing.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.pricing.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{td("marketing.pricing.support")}</p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {marketingOffer.tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-col rounded-2xl border border-amber-500/35 bg-zinc-950/60 p-6 md:p-7"
              >
                <p className="text-sm font-medium text-amber-400/90">
                  {tierBarberRangeLabel(tier, locale)}
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-400 md:text-4xl">
                  {tierPricePerMonthLabel(tier, locale)}
                </p>
                <p className={`mt-3 ${BODY}`}>
                  {locale === "th"
                    ? `ร้านที่มีช่าง ${tier.minBarbers}–${tier.maxBarbers} คน`
                    : `Shops with ${tier.minBarbers}–${tier.maxBarbers} barbers`}
                </p>
                <ul className="mt-5 space-y-2">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                      <Check size={16} className="mt-1 shrink-0 text-amber-400" />
                      {t(`marketing.pricing.benefit${n}` as MessageKey)}
                    </li>
                  ))}
                </ul>
                <TrialCta
                  label={td("marketing.pricing.cta")}
                  className="mt-auto pt-6"
                  fullWidth
                />
              </div>
            ))}

            <div className="flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950/40 p-6 md:p-7">
              <p className="text-sm font-medium text-zinc-400">
                {t("marketing.pricing.contactRange")}
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-100 md:text-4xl">
                {t("marketing.pricing.contactTitle")}
              </p>
              <p className={`mt-3 ${BODY}`}>{t("marketing.pricing.contactDesc")}</p>
              <ContactCta
                label={t("marketing.pricing.contactCta")}
                className="mt-auto pt-6"
              />
            </div>
          </div>

          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="flex items-start gap-2 text-sm text-zinc-400">
                <Check size={16} className="mt-0.5 shrink-0 text-amber-400" />
                {td(`marketing.pricing.assure${n}` as MessageKey)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-zinc-500">
            {locale === "th"
              ? `เริ่มจาก ${formatBaht(marketingOffer.tiers[0].monthlyPriceThb)} / เดือน สำหรับร้าน 1–5 ช่าง`
              : `From ${formatBaht(marketingOffer.tiers[0].monthlyPriceThb)} / month for 1–5 barbers`}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <div className="mx-auto max-w-[800px]">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.faq.eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
              {t("marketing.faq.title")}
            </h2>
            <p className={`mt-3 ${BODY}`}>{t("marketing.faq.support")}</p>
            <div className="mt-6 space-y-3 md:mt-8">
              {FAQ_ITEMS.map((n) => {
                const answerKey = `marketing.faq.${n}.a` as MessageKey;
                const answer = td(answerKey);
                return (
                  <details
                    key={n}
                    className="group rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 md:p-4 open:border-amber-500/30 open:py-4"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 text-zinc-50 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 text-base font-medium leading-snug">
                        {t(`marketing.faq.${n}.q` as MessageKey)}
                      </span>
                      <ChevronDown
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-400 transition-transform group-open:rotate-180"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </summary>
                    <p className={`mt-3 ${BODY}`}>{answer}</p>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="overflow-x-clip border-t border-amber-500/20 bg-zinc-900/60">
        <div className="mx-auto max-w-[1280px] px-4 py-12 text-center md:px-6 md:py-16">
          <h2 className="text-2xl font-bold leading-tight text-zinc-50 md:text-4xl">
            {t("marketing.final.title")}
          </h2>
          <p className={`mx-auto mt-4 max-w-xl ${BODY}`}>
            {td("marketing.final.subtitle")}
          </p>
          <TrialCta
            label={td("marketing.final.cta")}
            className="mx-auto mt-8 w-full md:max-w-[380px]"
            fullWidth
          />
          <p className="mt-4 text-[13px] text-zinc-400 md:text-sm">
            {td("marketing.final.micro")}
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
