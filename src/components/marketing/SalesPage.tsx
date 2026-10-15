"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  ChartColumn,
  Check,
  CircleCheck,
  ClipboardList,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  QrCode,
  Smartphone,
  UserRoundX,
  Users,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ClarityMarketingScript } from "@/components/marketing/ClarityMarketingScript";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { SalesHero } from "@/components/marketing/SalesHero";
import { CustomerStepPhone } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { OwnerSurfacePhone } from "@/components/marketing/mockups/OwnerSurfacesMockups";
import { LineReminderMockup } from "@/components/marketing/mockups/LineReminderMockup";
import { PainChatMockup } from "@/components/marketing/mockups/PainChatMockup";
import { PhoneScreen } from "@/components/marketing/mockups/PhoneScreen";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import {
  fillOfferCopy,
  marketingClaims,
  marketingOffer,
  tierBarberRangeLabel,
  tierPerDayHint,
  tierPricePerMonthLabel,
} from "@/lib/marketing/offer";

const HOW_ICONS = [MessageCircle, CircleCheck, Smartphone] as const;
const BOARD_ICONS = [Phone, CalendarClock, Users, Bell, QrCode] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const PRICING_INCLUDES = [1, 2, 3, 4, 5, 6] as const;
const PAIN_BULLETS = [1, 2, 3, 4] as const;
const PAIN_ICONS = [MessageCircle, ClipboardList, Users, UserRoundX] as const;
const TRIAL_BOX_ITEMS = [1, 2, 3, 4] as const;
const BODY = "text-[15px] leading-relaxed text-zinc-300 md:text-base";
/** Never render testimonials in production until real reviews exist. */
const SHOW_TESTIMONIALS_PLACEHOLDER = false;

function LineCta({
  label,
  className,
  placement,
}: {
  label: string;
  className?: string;
  placement: string;
}) {
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  if (!supportUrl) return null;
  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMarketingEvent("support_line_click", { cta_location: placement })}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-500/50 px-6 py-3 font-semibold text-amber-300 hover:bg-amber-500/10 ${className ?? ""}`}
    >
      {label}
    </a>
  );
}

function ContactCta({ label, className }: { label: string; className?: string }) {
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  if (!supportUrl) {
    return (
      <PrimaryTrialCta
        labelKey="marketing.pricing.cta"
        placement="pricing"
        fullWidth
        className={className}
      />
    );
  }
  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMarketingEvent("support_line_click", { cta_location: "pricing" })}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-500/50 bg-transparent px-6 py-3 font-semibold text-amber-300 hover:bg-amber-500/10 ${className ?? ""}`}
    >
      {label}
    </a>
  );
}

export function SalesPage() {
  const { t, locale } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));
  const heroCtaRef = useRef<HTMLDivElement | null>(null);
  const finalCtaRef = useRef<HTMLElement | null>(null);
  const pricingRef = useRef<HTMLElement | null>(null);
  const lineSectionRef = useRef<HTMLElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  useEffect(() => {
    const heroEl = heroCtaRef.current;
    const finalEl = finalCtaRef.current;
    if (!heroEl) return;

    let heroVisible = true;
    let finalVisible = false;

    const sync = () => setShowSticky(!heroVisible && !finalVisible);

    const heroObs = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    heroObs.observe(heroEl);

    let finalObs: IntersectionObserver | null = null;
    if (finalEl) {
      finalObs = new IntersectionObserver(
        ([entry]) => {
          finalVisible = entry.isIntersecting;
          sync();
        },
        { threshold: 0.15 },
      );
      finalObs.observe(finalEl);
    }

    return () => {
      heroObs.disconnect();
      finalObs?.disconnect();
    };
  }, []);

  useEffect(() => {
    const pricingEl = pricingRef.current;
    const lineEl = lineSectionRef.current;
    const seen = { pricing: false, line: false };

    const observers: IntersectionObserver[] = [];
    if (pricingEl) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !seen.pricing) {
            seen.pricing = true;
            trackMarketingEvent("pricing_view");
          }
        },
        { threshold: 0.35 },
      );
      obs.observe(pricingEl);
      observers.push(obs);
    }
    if (lineEl) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !seen.line) {
            seen.line = true;
            trackMarketingEvent("line_section_view");
          }
        },
        { threshold: 0.3 },
      );
      obs.observe(lineEl);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const painMessages = [
    t("marketing.pain.chat1"),
    t("marketing.pain.chat2"),
    t("marketing.pain.chat3"),
    t("marketing.pain.chat4"),
  ];
  const painTimes = [
    t("marketing.pain.chatTime1"),
    t("marketing.pain.chatTime2"),
    t("marketing.pain.chatTime3"),
    t("marketing.pain.chatTime4"),
  ];

  const lineBullets = [
    "marketing.line.bullet1",
    marketingClaims.reminderShortLeads
      ? "marketing.line.bullet2ShortLeads"
      : "marketing.line.bullet2",
    ...(marketingClaims.customerSelfReschedule
      ? (["marketing.line.bullet3"] as const)
      : []),
  ] as const;

  return (
    <div
      className={`min-h-full max-w-full overflow-x-clip bg-zinc-950 text-zinc-50 ${
        showSticky
          ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0"
          : "md:pb-0"
      }`}
    >
      <ClarityMarketingScript />
      <LiffCallbackRedirect />
      <AttributionCapture />
      <SalesHero heroCtaRef={heroCtaRef} />

      {/* Pain — mobile: chat → photo → copy; desktop: copy | photo + chat */}
      <section className="overflow-x-clip bg-zinc-900/50">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-12 md:gap-10 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="order-1 flex flex-col gap-5 lg:order-2">
            <PainChatMockup
              messages={painMessages}
              times={painTimes}
              footer={t("marketing.pain.visualFooter")}
              unreadLabel={t("marketing.pain.unreadBadge")}
            />
            <MarketingPhotoSlot
              slot="painBarber"
              alt={t("marketing.pain.photoAlt")}
              sizes="(min-width: 1024px) 40vw, 92vw"
              className="w-full"
            />
          </div>
          <div className="order-2 lg:order-1">
            <h2 className="text-[2rem] font-extrabold leading-[1.2] tracking-tight text-zinc-50 sm:text-[2.35rem] md:text-5xl lg:text-[3.15rem] lg:leading-[1.15]">
              {t("marketing.pain.title")}
            </h2>
            <ul className="mt-8 space-y-5">
              {PAIN_BULLETS.map((n) => {
                const Icon = PAIN_ICONS[n - 1];
                return (
                  <li key={n} className="flex gap-3.5 sm:gap-4">
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-400/10 text-amber-300"
                      aria-hidden
                    >
                      <Icon size={20} strokeWidth={2.25} />
                    </span>
                    <p className="pt-1.5 text-[1.05rem] font-semibold leading-snug text-zinc-100 sm:text-lg md:text-xl">
                      {t(`marketing.pain.bullet${n}` as MessageKey)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-8 text-xl font-extrabold leading-snug tracking-tight text-amber-300 sm:text-2xl md:text-[1.75rem] md:leading-snug">
              {t("marketing.pain.punchline")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
              {t("marketing.pain.close")}
            </p>
          </div>
        </div>
      </section>

      {/* LINE Signature */}
      <section
        id="line-messages"
        ref={lineSectionRef}
        className="scroll-mt-20 overflow-x-clip"
      >
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="order-2 flex flex-col items-center gap-6 lg:order-1">
            <LineReminderMockup
              shopName="BarberQx Demo"
              title={t("marketing.line.mockTitle")}
              body={t("marketing.line.mockBody")}
              whenLabel={t("marketing.line.mockWhen")}
              cta={t("marketing.line.mockCta")}
            />
            <PhoneScreen screen="ticket" fluid className="mx-auto w-[min(64vw,200px)]" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.line.eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.line.title")}
            </h2>
            <ul className="mt-6 space-y-4">
              {lineBullets.map((key) => (
                <li key={key} className={`flex gap-3 ${BODY}`}>
                  <Check size={18} className="mt-0.5 shrink-0 text-amber-400" />
                  <span>{td(key as MessageKey)}</span>
                </li>
              ))}
            </ul>
            {marketingClaims.reminderShortLeads ? (
              <div className="mt-5">
                <p className="text-sm font-semibold text-zinc-200">
                  {t("marketing.line.leadsLabel")}
                </p>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {(
                    [
                      "marketing.line.lead1d",
                      "marketing.line.lead3h",
                      "marketing.line.lead1h",
                      "marketing.line.lead30m",
                      "marketing.line.leadNone",
                    ] as const
                  ).map((key) => (
                    <li
                      key={key}
                      className="rounded-lg border border-amber-500/35 bg-zinc-950/70 px-3 py-1.5 text-sm font-medium text-amber-100"
                    >
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {marketingClaims.customerSelfReschedule ? (
              <div className="mt-5 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <CalendarClock size={20} className="mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <h3 className="text-base font-semibold text-zinc-50">
                      {t("marketing.line.rescheduleTitle")}
                    </h3>
                    <p className={`mt-1.5 ${BODY}`}>{t("marketing.line.rescheduleBody")}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <p className="mt-5 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-3 py-2.5 text-[13px] leading-relaxed text-zinc-400 md:text-sm">
              {t("marketing.line.evidence")}
            </p>
            <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-400/5 p-4 md:p-5">
              <h3 className="text-base font-semibold text-amber-200">
                {td("marketing.line.costTitle")}
              </h3>
              <p className={`mt-2 ${BODY}`}>{td("marketing.line.costBody")}</p>
              <p className="mt-3 text-sm font-medium text-zinc-200">
                {td("marketing.line.costClose")}
              </p>
            </div>
            <div className="mt-6 flex w-full max-w-[480px] flex-col gap-3">
              <PrimaryTrialCta labelKey="marketing.line.cta" placement="line" fullWidth />
              <LineCta label={t("marketing.line.lineCta")} className="w-full" placement="line" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">
            {t("marketing.how.title")}
          </h2>
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
          <p className="mt-8 text-center text-sm text-zinc-400">{t("marketing.how.micro")}</p>
        </div>
      </section>

      {/* Board — barbers / front desk */}
      <section id="board" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.board.title")}
            </h2>
            <ul className="mt-6 space-y-4">
              {([1, 2, 3, 4, 5] as const).map((n) => {
                const Icon = BOARD_ICONS[n - 1];
                return (
                  <li key={n} className="flex gap-3">
                    <Icon size={20} className="mt-0.5 shrink-0 text-amber-400" strokeWidth={2} />
                    <div>
                      <p className="font-semibold text-zinc-50">
                        {t(`marketing.board.${n}.title` as MessageKey)}
                      </p>
                      <p className={`mt-1 ${BODY}`}>
                        {t(`marketing.board.${n}.desc` as MessageKey)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:flex-col">
            <OwnerSurfacePhone surface="queue" />
            <MarketingPhotoSlot
              pair="barber"
              alt={t("marketing.board.photoAlt")}
              desktopSizes="280px"
              mobileSizes="60vw"
              className="w-full max-w-[240px] min-h-[280px]"
            />
          </div>
        </div>
      </section>

      {/* Owner stats */}
      <section id="owner" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.owner.title")}
            </h2>
            <p className={`mt-4 ${BODY}`}>{t("marketing.owner.body")}</p>
            <ul className="mt-5 space-y-2">
              {([1, 2, 3] as const).map((n) => (
                <li key={n} className={`flex items-center gap-2 ${BODY}`}>
                  <ChartColumn size={16} className="shrink-0 text-amber-400" />
                  {t(`marketing.owner.metric${n}` as MessageKey)}
                </li>
              ))}
            </ul>
          </div>
          <figure className="flex flex-col items-center">
            <OwnerSurfacePhone surface="stats" />
            <figcaption className="mt-3 text-center text-sm text-zinc-500">
              {t("marketing.owner.caption")}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Founder */}
      <section id="founder" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[800px] px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <MarketingPhotoSlot
              slot="founder"
              alt={t("marketing.founder.photoAlt")}
              shape="circle"
              sizes="160px"
              className="h-36 w-36 shrink-0 aspect-square sm:h-40 sm:w-40"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.founder.title")}
              </h2>
              <p className={`mt-3 ${BODY}`}>{td("marketing.founder.body")}</p>
              <div className="mt-5 flex justify-center sm:justify-start">
                <LineCta label={t("marketing.founder.cta")} placement="founder" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {SHOW_TESTIMONIALS_PLACEHOLDER ? (
        <section id="testimonials" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30" aria-hidden>
          <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6">
            <p className="text-sm font-medium text-zinc-500">
              {t("marketing.testimonials.placeholder")}
            </p>
          </div>
        </section>
      ) : null}

      {/* Pricing */}
      <section id="pricing" ref={pricingRef} className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.pricing.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
            {td("marketing.pricing.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{td("marketing.pricing.support")}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketingOffer.tiers.map((tier) => {
              const perDay = tierPerDayHint(tier, locale);
              const isStarter = tier.id === "tier1";
              return (
                <div
                  key={tier.id}
                  className={
                    isStarter
                      ? "flex flex-col rounded-2xl border-2 border-amber-400/70 bg-zinc-950/60 p-6 md:p-7"
                      : "flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950/40 p-6 md:p-7"
                  }
                >
                  {isStarter ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                      {t("marketing.pricing.tier1Badge")}
                    </p>
                  ) : null}
                  <p className="text-sm font-medium text-amber-400/90">
                    {tierBarberRangeLabel(tier, locale)}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-400 md:text-4xl">
                    {tierPricePerMonthLabel(tier, locale)}
                  </p>
                  {perDay ? (
                    <p className="mt-1 text-sm text-zinc-400">{perDay}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-zinc-400">
                    {t("marketing.pricing.tierSameFeatures")}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {PRICING_INCLUDES.map((n) => (
                      <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                        <Check size={16} className="mt-1 shrink-0 text-amber-400" />
                        {t(`marketing.pricing.include${n}` as MessageKey)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <PrimaryTrialCta
                      labelKey="marketing.pricing.cta"
                      placement="pricing"
                      fullWidth
                    />
                    <p className="mt-2 text-center text-[13px] text-zinc-500">
                      {td("marketing.pricing.micro")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-zinc-700 bg-zinc-950/40 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div>
              <p className="text-sm font-medium text-zinc-400">
                {t("marketing.pricing.contactRange")}
              </p>
              <p className="mt-1 text-xl font-bold text-zinc-100">
                {t("marketing.pricing.contactTitle")}
              </p>
              <p className={`mt-1 ${BODY}`}>{t("marketing.pricing.contactDesc")}</p>
            </div>
            <ContactCta label={t("marketing.pricing.contactCta")} className="sm:w-auto sm:min-w-[180px]" />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                {t("marketing.pricing.requiresTitle")}
              </h3>
              <p className={`mt-2 ${BODY}`}>{t("marketing.pricing.requiresBody")}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                {t("marketing.pricing.excludesTitle")}
              </h3>
              <p className={`mt-2 ${BODY}`}>{td("marketing.pricing.excludesBody")}</p>
            </div>
          </div>

          {/* Trial / risk-reversal box */}
          <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-400/5 p-5 md:p-7">
            <h3 className="text-xl font-bold text-zinc-50">{td("marketing.trialBox.title")}</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {TRIAL_BOX_ITEMS.map((n) => (
                <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                  <Check size={16} className="mt-1 shrink-0 text-amber-400" />
                  {t(`marketing.trialBox.item${n}` as MessageKey)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-zinc-400">{td("marketing.trialBox.footer")}</p>
          </div>
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
            <div className="mt-6 space-y-3 md:mt-8">
              {FAQ_ITEMS.map((n) => (
                <details
                  key={n}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 open:border-amber-500/30 open:pb-4"
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) {
                      trackMarketingEvent("faq_open", { faq_id: String(n) });
                    }
                  }}
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 text-zinc-50 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 text-base font-medium leading-snug">
                      {td(`marketing.faq.${n}.q` as MessageKey)}
                    </span>
                    <Plus
                      size={18}
                      className="shrink-0 text-amber-400 group-open:hidden"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <Minus
                      size={18}
                      className="hidden shrink-0 text-amber-400 group-open:block"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </summary>
                  <p className={`pb-2 ${BODY}`}>{td(`marketing.faq.${n}.a` as MessageKey)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={finalCtaRef}
        className="overflow-x-clip border-t border-amber-500/20 bg-zinc-900/60"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-12 text-center md:px-6 md:py-16">
          <h2 className="text-2xl font-bold leading-tight text-zinc-50 md:text-4xl">
            {t("marketing.final.title")}
          </h2>
          <p className={`mx-auto mt-4 max-w-xl ${BODY}`}>{t("marketing.final.sub")}</p>
          <div className="mx-auto mt-8 flex w-full max-w-[480px] flex-col gap-3">
            <PrimaryTrialCta labelKey="marketing.final.cta" placement="final" fullWidth />
            <LineCta label={t("marketing.final.lineCta")} className="w-full" placement="final" />
          </div>
          <p className="mt-4 text-[13px] text-zinc-400 md:text-sm">
            {td("marketing.final.micro")}
          </p>
        </div>
      </section>

      <MarketingFooter />

      {/* Sticky mobile CTA */}
      {showSticky ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-3 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <PrimaryTrialCta
            labelKey="marketing.sticky.cta"
            placement="sticky"
            eventName="sticky_cta_click"
            fullWidth
            riskClassName="mt-2 justify-center text-[13px] sm:text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}
