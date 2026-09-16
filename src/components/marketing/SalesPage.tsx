"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  CalendarClock,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  MessageCircle,
  MessageCircleOff,
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

function Section({
  id,
  title,
  children,
  className,
  titleClassName,
}: {
  id?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-12 md:py-16 ${className ?? ""}`}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        {title ? (
          <h2 className={`text-2xl font-bold text-zinc-50 md:text-3xl ${titleClassName ?? ""}`}>
            {title}
          </h2>
        ) : null}
        <div className={title ? "mt-6 md:mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}

function CompareCard({
  label,
  subhead,
  steps,
  takeaway,
  variant,
  imageSrc,
  imageAlt,
}: {
  label: string;
  subhead: string;
  steps: string[];
  takeaway: string;
  variant: "before" | "after";
  imageSrc: string;
  imageAlt: string;
}) {
  const isAfter = variant === "after";
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        isAfter
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div className="relative h-48 w-full overflow-hidden md:h-56">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1672}
          height={941}
          sizes="(max-width: 767px) 92vw, (max-width: 1023px) 48vw, 580px"
          className={`h-full w-full object-cover object-[70%_center] ${
            isAfter
              ? "brightness-[1.12] contrast-[1.06]"
              : "brightness-[1.08] contrast-[1.06] saturate-[0.95]"
          }`}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-zinc-950/75 via-zinc-950/35 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-y-0 left-0 z-10 flex w-[52%] flex-col justify-end p-4 md:p-5">
          <h3
            className={`flex items-center gap-2 font-semibold ${
              isAfter ? "text-amber-400" : "text-zinc-200"
            }`}
          >
            {isAfter ? <Check size={18} /> : null}
            {label}
          </h3>
          <p className="mt-1 text-base font-semibold leading-snug text-zinc-50 md:text-lg">
            {subhead}
          </p>
          <p className={`mt-1.5 text-sm md:text-base ${isAfter ? "text-amber-300" : "text-zinc-200"}`}>
            {takeaway}
          </p>
        </div>
      </div>
      <div className="p-4 md:p-5">
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-[15px] leading-snug md:text-base">
              <span
                className={`w-7 shrink-0 font-semibold tabular-nums ${
                  isAfter ? "text-amber-400/80" : "text-zinc-500"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={isAfter ? "text-zinc-200" : "text-zinc-400"}>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const HOW_ICONS = [MessageCircle, CalendarClock, CircleCheck] as const;

function HowStep({
  n,
  title,
  desc,
  isLast,
}: {
  n: 1 | 2 | 3;
  title: string;
  desc: string;
  isLast: boolean;
}) {
  const Icon = HOW_ICONS[n - 1];
  return (
    <li
      className={`relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:rounded-2xl lg:border lg:p-5 lg:pb-5 ${
        isLast
          ? "lg:border-amber-500/30 lg:bg-amber-500/5"
          : "lg:border-zinc-800 lg:bg-zinc-900/50"
      }`}
    >
      {isLast ? null : (
        <>
          <span
            aria-hidden
            className="absolute top-7 bottom-0 left-4 w-0.5 -translate-x-1/2 bg-zinc-400 lg:hidden"
          />
          <span
            aria-hidden
            className="absolute top-10 left-full hidden h-px w-6 bg-zinc-500 lg:block"
          />
        </>
      )}
      <span className="relative z-10 w-8 shrink-0 text-center text-xl font-bold tabular-nums text-amber-400 lg:mb-3 lg:w-auto lg:text-left lg:text-3xl">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon size={18} className="shrink-0 text-amber-400" strokeWidth={2} />
          <h3 className="text-lg font-bold leading-snug text-zinc-50 lg:text-lg lg:font-semibold">
            {title}
          </h3>
        </div>
        <p className="mt-2 text-base leading-[1.65] text-zinc-300 lg:mt-1.5 lg:text-base lg:leading-relaxed">
          {desc}
        </p>
      </div>
    </li>
  );
}

function CustomerJourneyStep({
  n,
  title,
  desc,
}: {
  n: 1 | 2 | 3;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex flex-col items-center text-center">
      <span className="text-xl font-bold tabular-nums text-amber-400 lg:text-3xl">
        {String(n).padStart(2, "0")}
      </span>
      <h3 className="mt-2 text-lg font-bold leading-snug text-zinc-50 lg:font-semibold">
        {title}
      </h3>
      <p className={`mt-1.5 ${BODY}`}>{desc}</p>
      <div className="mt-4">
        <CustomerStepPhone step={n} />
      </div>
    </li>
  );
}

function OwnerSurface({
  label,
  title,
  desc,
  surface,
}: {
  label: string;
  title: string;
  desc: string;
  surface: "queue" | "team";
}) {
  return (
    <li className="flex flex-col items-center text-center lg:items-start lg:text-left">
      <p className="text-sm font-medium text-amber-400/90">{label}</p>
      <h3 className="mt-2 text-lg font-bold leading-snug text-zinc-50 lg:font-semibold">
        {title}
      </h3>
      <p className={`mt-1.5 ${BODY}`}>{desc}</p>
      <div className="mt-4 w-full">
        <OwnerSurfacePhone surface={surface} />
      </div>
    </li>
  );
}

function BenefitCard({
  n,
  title,
  desc,
}: {
  n: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
}) {
  const Icon = BENEFIT_ICONS[n - 1];
  const primary = n === 1;
  return (
    <li
      className={`h-full rounded-2xl border p-4 md:p-5 ${
        primary
          ? "border-amber-500/30 bg-amber-500/5 lg:p-6"
          : "border-zinc-800 bg-zinc-900/50 lg:border-transparent lg:bg-transparent lg:p-1"
      }`}
    >
      <Icon size={18} className="text-amber-400 lg:size-7" strokeWidth={2} />
      <h3 className="mt-3 text-lg font-bold leading-snug text-zinc-50 lg:mt-4 lg:text-xl">{title}</h3>
      <p className={`mt-2 ${BODY}`}>{desc}</p>
    </li>
  );
}

function FitPoint({
  n,
  title,
  desc,
}: {
  n: 1 | 2 | 3;
  title: string;
  desc: string;
}) {
  const Icon = FIT_ICONS[n - 1];
  return (
    <li className="border-b border-zinc-800 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-amber-400" strokeWidth={2} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-zinc-50">{title}</h3>
          <p className={`mt-1.5 ${BODY}`}>{desc}</p>
        </div>
      </div>
    </li>
  );
}

function SetupStep({
  n,
  title,
  desc,
  isLast,
}: {
  n: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
  isLast: boolean;
}) {
  return (
    <li
      className={`relative flex h-full gap-3 pb-6 last:pb-0 md:rounded-xl md:border md:p-4 md:pb-4 ${
        isLast
          ? "rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 md:p-4"
          : "md:border-zinc-800"
      }`}
    >
      {isLast ? null : (
        <span
          aria-hidden
          className="absolute top-8 bottom-0 left-4 w-0.5 -translate-x-1/2 bg-zinc-700 md:hidden"
        />
      )}
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold tabular-nums text-amber-400">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-snug text-zinc-50">{title}</h3>
        <p className={`mt-1.5 ${BODY}`}>{desc}</p>
      </div>
    </li>
  );
}

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
      className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950 ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
    >
      {label}
    </MarketingTrialLink>
  );
}

const BENEFIT_ICONS = [MessageCircleOff, Clock3, CalendarClock, Store] as const;
const BENEFIT_KEYS = [1, 2, 3, 4] as const;
const FIT_ICONS = [Users, MessageCircle, CircleCheck] as const;
const FIT_KEYS = [1, 2, 3] as const;
const SETUP_STEPS = [1, 2, 3, 4] as const;
const PRICING_BENEFITS = [1, 2, 3, 4, 5, 6] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6] as const;
const BODY = "text-[15px] leading-relaxed text-zinc-300 md:text-base";

export function SalesPage() {
  const { t } = useI18n();

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  const beforeSteps = [1, 2, 3, 4, 5, 6].map((n) =>
    t(`marketing.beforeAfter.before${n}` as MessageKey),
  );
  const afterSteps = [1, 2, 3, 4, 5].map((n) =>
    t(`marketing.beforeAfter.after${n}` as MessageKey),
  );

  const painMessages = [
    t("marketing.pain.chat1"),
    t("marketing.pain.chat2"),
    t("marketing.pain.chat3"),
    t("marketing.pain.chat4"),
  ];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <LiffCallbackRedirect />
      <AttributionCapture />
      <SalesHero />

      {/* Pain */}
      <section className="overflow-x-clip bg-zinc-900/40">
        <div className="mx-auto grid max-w-[1280px] items-center gap-6 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,54%)_minmax(0,46%)] lg:gap-10">
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
          <PainChatMockup
            messages={painMessages}
            footer={t("marketing.pain.visualFooter")}
          />
        </div>
      </section>

      {/* Before / After */}
      <section className="overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.beforeAfter.eyebrow")}
          </p>
          <h2 className="mt-2 text-[1.75rem] font-bold leading-[1.2] text-zinc-50 md:text-4xl lg:text-[2.5rem]">
            {t("marketing.beforeAfter.titleLine1")}
            <br />
            {t("marketing.beforeAfter.titleLine2")}
          </h2>
          <p className={`mt-3 ${BODY}`}>{t("marketing.beforeAfter.support")}</p>
          <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-[minmax(0,47%)_minmax(0,53%)] lg:gap-6">
            <CompareCard
              label={t("marketing.beforeAfter.before")}
              subhead={t("marketing.beforeAfter.beforeSubhead")}
              steps={beforeSteps}
              takeaway={t("marketing.beforeAfter.beforeTakeaway")}
              variant="before"
              imageSrc="/marketing/barberqx/before-manual-booking.png"
              imageAlt={t("marketing.beforeAfter.beforeAlt")}
            />
            <p className="text-center text-sm text-zinc-500 lg:hidden">
              {t("marketing.beforeAfter.transition")}
            </p>
            <CompareCard
              label={t("marketing.beforeAfter.after")}
              subhead={t("marketing.beforeAfter.afterSubhead")}
              steps={afterSteps}
              takeaway={t("marketing.beforeAfter.afterTakeaway")}
              variant="after"
              imageSrc="/marketing/barberqx/after-organized-workflow.png"
              imageAlt={t("marketing.beforeAfter.afterAlt")}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.how.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.how.title")}
          </h2>
          <p className={`mt-3 ${BODY}`}>{t("marketing.how.support")}</p>
          <ol className="mt-6 grid lg:grid-cols-3 lg:gap-6">
            {([1, 2, 3] as const).map((n) => (
              <HowStep
                key={n}
                n={n}
                title={t(`marketing.how.${n}.title` as MessageKey)}
                desc={t(`marketing.how.${n}.desc` as MessageKey)}
                isLast={n === 3}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* Customer experience */}
      <section className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.customer.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.customer.title")}
          </h2>
          <p className={`mt-3 ${BODY}`}>{t("marketing.customer.support")}</p>
          <ol className="mt-6 grid gap-10 lg:grid-cols-3 lg:gap-6">
            {([1, 2, 3] as const).map((n) => (
              <CustomerJourneyStep
                key={n}
                n={n}
                title={t(`marketing.customer.${n}.title` as MessageKey)}
                desc={t(`marketing.customer.${n}.desc` as MessageKey)}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* Owner experience */}
      <section className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="lg:grid lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-10">
            <header>
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.owner.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.owner.title")}
              </h2>
              <p className={`mt-3 ${BODY}`}>{t("marketing.owner.support")}</p>
            </header>
            <ol className="mt-10 grid gap-10 lg:mt-0 lg:grid-cols-2 lg:gap-6">
              <OwnerSurface
                label={t("marketing.owner.1.label")}
                title={t("marketing.owner.1.title")}
                desc={t("marketing.owner.1.desc")}
                surface="queue"
              />
              <OwnerSurface
                label={t("marketing.owner.2.label")}
                title={t("marketing.owner.2.title")}
                desc={t("marketing.owner.2.desc")}
                surface="team"
              />
            </ol>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="features" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.benefits.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.benefits.title")}
          </h2>
          <p className={`mt-3 ${BODY}`}>{t("marketing.benefits.support")}</p>
          <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-8">
            {BENEFIT_KEYS.map((n) => (
              <BenefitCard
                key={n}
                n={n}
                title={t(`marketing.benefits.${n}.title` as MessageKey)}
                desc={t(`marketing.benefits.${n}.desc` as MessageKey)}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* Built for barbers */}
      <section className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="lg:grid lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-start lg:gap-10">
            <header>
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.barber.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.barber.title1")}
                <span className="mt-1 block">{t("marketing.barber.title2")}</span>
              </h2>
              <p className={`mt-3 ${BODY}`}>{t("marketing.barber.support")}</p>
            </header>
            <ol className="mt-8 lg:mt-0">
              {FIT_KEYS.map((n) => (
                <FitPoint
                  key={n}
                  n={n}
                  title={t(`marketing.barber.${n}.title` as MessageKey)}
                  desc={t(`marketing.barber.${n}.desc` as MessageKey)}
                />
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="lg:grid lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:items-start lg:gap-10">
            <header>
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.setup.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.setup.title")}
                <span className="mt-1 block">{t("marketing.setup.title2")}</span>
              </h2>
              <p className={`mt-3 ${BODY}`}>{t("marketing.setup.support")}</p>
              <div className="mt-6 hidden lg:block">
                <TrialCta label={t("marketing.setup.cta")} />
              </div>
            </header>
            <ol className="mt-8 grid md:grid-cols-2 md:gap-4 lg:mt-0">
              {SETUP_STEPS.map((n) => (
                <SetupStep
                  key={n}
                  n={n}
                  title={t(`marketing.setup.${n}.title` as MessageKey)}
                  desc={t(`marketing.setup.${n}.desc` as MessageKey)}
                  isLast={n === 4}
                />
              ))}
            </ol>
            <div className="mt-8 lg:hidden">
              <TrialCta
                label={t("marketing.setup.cta")}
                className="w-full"
                fullWidth
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="lg:grid lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-start lg:gap-10">
            <header>
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.pricing.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.pricing.title")}
              </h2>
              <p className={`mt-3 ${BODY}`}>{t("marketing.pricing.support")}</p>
              <p className="mt-3 hidden text-sm text-amber-400/90 lg:block">
                {t("marketing.pricing.reassure")}
              </p>
            </header>
            <div className="mt-8 rounded-2xl border border-amber-500/40 bg-zinc-900/80 p-6 md:p-8 lg:mt-0">
              <p className="text-4xl font-bold text-amber-400 md:text-5xl">
                {t("marketing.pricing.price")}
              </p>
              <p className={`mt-3 ${BODY}`}>{t("marketing.pricing.desc")}</p>
              <ul className="mt-6 grid gap-2">
                {PRICING_BENEFITS.map((n) => (
                  <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                    <Check size={16} className="mt-1 shrink-0 text-amber-400" />
                    {t(`marketing.pricing.benefit${n}` as MessageKey)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-medium text-zinc-200">
                {t("marketing.pricing.trial")}
              </p>
              <p className="mt-4 hidden text-sm leading-relaxed text-zinc-300 lg:block">
                {t("marketing.pricing.ctaContext")}
              </p>
              <TrialCta
                label={t("marketing.pricing.cta")}
                className="mt-6 min-h-14 w-full lg:mt-4"
                fullWidth
              />
              <p className="mt-3 text-center text-[13px] text-zinc-400">
                {t("marketing.pricing.micro")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-[800px]">
            <header>
              <p className="text-sm font-medium text-amber-400/90">
                {t("marketing.faq.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.faq.title")}
              </h2>
              <p className={`mt-3 ${BODY}`}>{t("marketing.faq.support")}</p>
            </header>
            <div className="mt-6 space-y-3 md:mt-8">
              {FAQ_ITEMS.map((n) => (
                <details
                  key={n}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 md:p-4 open:border-amber-500/30 open:py-4"
                >
                  <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 text-zinc-50 [&::-webkit-details-marker]:hidden">
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
                  <p className={`mt-3 ${BODY}`}>
                    {t(`marketing.faq.${n}.a` as MessageKey)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="overflow-x-clip border-t border-amber-500/20 bg-zinc-900/60">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <div className="relative mx-auto max-w-[800px] text-center">
            <div
              className="pointer-events-none absolute inset-x-8 -top-6 h-20 rounded-full bg-amber-400/10 blur-2xl"
              aria-hidden
            />
            <h2 className="relative text-2xl font-bold leading-tight text-zinc-50 md:text-4xl">
              {t("marketing.final.title")}
            </h2>
            <p className={`relative mx-auto mt-4 max-w-xl ${BODY}`}>
              {t("marketing.final.subtitle")}
            </p>
            <TrialCta
              label={t("marketing.final.cta")}
              className="relative mx-auto mt-8 min-h-14 w-full md:max-w-[380px]"
              fullWidth
            />
            <p className="relative mt-4 text-[13px] text-zinc-400 md:text-sm">
              {t("marketing.final.micro")}
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
