"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  MessageCircleOff,
  Store,
  Users,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { BookingMockup } from "@/components/marketing/mockups/BookingMockup";
import { CustomerJourneyMockups } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { OwnerSurfacesMockups } from "@/components/marketing/mockups/OwnerSurfacesMockups";
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

function FlowCard({
  label,
  steps,
  variant,
}: {
  label: string;
  steps: string[];
  variant: "before" | "after";
}) {
  const isAfter = variant === "after";
  return (
    <div
      className={`rounded-2xl border p-6 ${
        isAfter
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <h3
        className={`flex items-center gap-2 font-semibold ${
          isAfter ? "text-amber-400" : "text-zinc-400"
        }`}
      >
        {isAfter ? <Check size={18} /> : null}
        {label}
      </h3>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className={`flex items-center gap-2 ${BODY}`}>
            {i > 0 ? (
              <ArrowRight
                size={14}
                className={`hidden shrink-0 md:inline ${isAfter ? "text-amber-500/60" : "text-zinc-600"}`}
              />
            ) : null}
            <span className={isAfter ? "text-zinc-200" : "text-zinc-400"}>{step}</span>
            {i < steps.length - 1 ? (
              <ChevronDown
                size={14}
                className={`shrink-0 md:hidden ${isAfter ? "text-amber-500/60" : "text-zinc-600"}`}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
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
    <Link
      href="/trial"
      onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950 ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}

const BENEFIT_ICONS = [MessageCircleOff, Clock3, Users, Store] as const;
const BENEFIT_KEYS = [1, 2, 3, 4] as const;
const BARBER_CHIPS = [1, 2, 3, 4, 5, 6, 7] as const;
const SETUP_STEPS = [1, 2, 3, 4] as const;
const PRICING_BENEFITS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6] as const;
const HERO_TRUST = [1, 2, 3] as const;
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
    { from: "customer" as const, text: t("marketing.pain.chat1") },
    { from: "shop" as const, text: t("marketing.pain.chat2") },
    { from: "customer" as const, text: t("marketing.pain.chat3") },
    { from: "shop" as const, text: t("marketing.pain.chat4") },
  ];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <LiffCallbackRedirect />
      <AttributionCapture />
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950 py-14 md:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 md:grid-cols-2 md:gap-12 md:px-6">
          <div className="text-left">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.hero.eyebrow")}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl lg:text-6xl">
              {t("marketing.hero.title")}
            </h1>
            <p className={`mt-4 ${BODY} md:text-lg`}>{t("marketing.hero.subtitle")}</p>
            <p className={`mt-2 ${BODY}`}>{t("marketing.hero.subtitle2")}</p>
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-start">
              <TrialCta
                label={t("marketing.hero.cta")}
                className="hidden md:inline-flex"
              />
              <TrialCta
                label={t("marketing.hero.ctaShort")}
                className="md:hidden"
                fullWidth
              />
              <a
                href="#how-it-works"
                onClick={() => trackMarketingEvent("how_it_works_click")}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-600 px-6 py-3 font-medium text-zinc-200 md:w-auto"
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
          <div className="flex justify-center overflow-hidden md:justify-end">
            <BookingMockup size="xl" />
          </div>
        </div>
      </section>

      {/* Pain */}
      <Section className="bg-zinc-900/30">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">{t("marketing.pain.title")}</h2>
            <p className={`mt-4 ${BODY}`}>{t("marketing.pain.support")}</p>
            <p className="mt-4 font-semibold text-amber-400">{t("marketing.pain.emphasis")}</p>
          </div>
          <PainChatMockup
            customerLabel={t("marketing.pain.customer")}
            shopLabel={t("marketing.pain.shop")}
            messages={painMessages}
          />
        </div>
      </Section>

      {/* Before / After */}
      <Section title={t("marketing.beforeAfter.title")}>
        <div className="grid gap-6 md:grid-cols-2">
          <FlowCard
            label={t("marketing.beforeAfter.before")}
            steps={beforeSteps}
            variant="before"
          />
          <FlowCard
            label={t("marketing.beforeAfter.after")}
            steps={afterSteps}
            variant="after"
          />
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" title={t("marketing.how.title")} className="bg-zinc-900/30">
        <ol className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="rounded-2xl border border-zinc-800 p-5">
              <span className="text-2xl font-bold text-amber-400">0{n}</span>
              <p className={`mt-2 ${BODY}`}>{t(`marketing.how.${n}` as MessageKey)}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Customer experience */}
      <Section title={t("marketing.customer.title")}>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
          <p className={`${BODY} md:text-lg`}>{t("marketing.customer.desc")}</p>
          <div className="hidden lg:block">
            <CustomerJourneyMockups />
          </div>
          <div className="lg:hidden">
            <CustomerJourneyMockups compact />
          </div>
        </div>
      </Section>

      {/* Owner experience */}
      <Section title={t("marketing.owner.title")} className="bg-zinc-900/30">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="order-2 lg:order-1">
            <div className="hidden lg:block">
              <OwnerSurfacesMockups />
            </div>
            <div className="lg:hidden">
              <OwnerSurfacesMockups compact />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className={`${BODY} md:text-lg`}>{t("marketing.owner.desc")}</p>
          </div>
        </div>
      </Section>

      {/* Benefits */}
      <Section id="features" title={t("marketing.benefits.title")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFIT_KEYS.map((n, i) => {
            const Icon = BENEFIT_ICONS[i];
            return (
              <div
                key={n}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <Icon size={22} className="text-amber-400" strokeWidth={2} />
                <h3 className="mt-3 font-semibold text-zinc-100">
                  {t(`marketing.benefits.${n}.title` as MessageKey)}
                </h3>
                <p className={`mt-2 ${BODY}`}>
                  {t(`marketing.benefits.${n}.desc` as MessageKey)}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Built for barbers */}
      <Section className="bg-zinc-900/30">
        <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">
          {t("marketing.barber.title1")}
          <br />
          <span className="text-amber-400">{t("marketing.barber.title2")}</span>
        </h2>
        <p className="mt-4 text-sm text-zinc-500">{t("marketing.barber.vocab")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {BARBER_CHIPS.map((n) => (
            <span
              key={n}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200/90"
            >
              {t(`marketing.barber.chip${n}` as MessageKey)}
            </span>
          ))}
        </div>
      </Section>

      {/* Setup */}
      <Section title={t("marketing.setup.title")}>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
          <ol className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:gap-3">
            {SETUP_STEPS.map((n, i) => (
              <li key={n} className={`flex items-center gap-2 ${BODY}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {n}
                </span>
                <span>{t(`marketing.setup.step${n}` as MessageKey)}</span>
                {i < SETUP_STEPS.length - 1 ? (
                  <ArrowRight size={14} className="hidden text-zinc-600 md:inline" />
                ) : null}
              </li>
            ))}
          </ol>
          <TrialCta
            label={t("marketing.setup.cta")}
            className="mt-6 w-full md:w-auto"
            fullWidth
          />
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" title={t("marketing.pricing.title")} className="bg-zinc-900/30">
        <div className="mx-auto w-full max-w-[800px] rounded-2xl border border-amber-500/40 bg-zinc-900/80 p-8 md:p-10">
          <p className="text-4xl font-bold text-amber-400 md:text-5xl">
            {t("marketing.pricing.price")}
          </p>
          <p className="mt-3 text-lg text-zinc-300">{t("marketing.pricing.trial")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("marketing.pricing.barbers")}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {PRICING_BENEFITS.map((n) => (
              <li key={n} className={`flex items-center gap-2 ${BODY}`}>
                <Check size={16} className="shrink-0 text-amber-400" />
                {t(`marketing.pricing.benefit${n}` as MessageKey)}
              </li>
            ))}
          </ul>
          <TrialCta
            label={t("marketing.pricing.cta")}
            className="mt-8 w-full sm:w-auto"
            fullWidth
          />
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" title={t("marketing.faq.title")}>
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ_ITEMS.map((n) => (
            <details key={n} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <summary className="cursor-pointer font-medium text-zinc-200">
                {t(`marketing.faq.${n}.q` as MessageKey)}
              </summary>
              <p className={`mt-3 ${BODY}`}>
                {t(`marketing.faq.${n}.a` as MessageKey)}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section className="border-t border-amber-500/20 bg-zinc-900/60 py-14 md:py-20">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <h2 className="text-2xl font-bold md:text-4xl">{t("marketing.final.title")}</h2>
          <p className={`mx-auto mt-4 max-w-xl ${BODY}`}>{t("marketing.final.subtitle")}</p>
          <TrialCta
            label={t("marketing.final.cta")}
            className="mx-auto mt-8 w-full max-w-[380px]"
            fullWidth
          />
          <p className="mt-4 text-[13px] text-zinc-400 md:text-sm">
            {t("marketing.final.trust1")} • {t("marketing.final.trust2")}
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
