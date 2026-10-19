"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  CalendarClock,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  MessageCircle,
  Phone,
  QrCode,
  Smartphone,
  Users,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ClarityMarketingScript } from "@/components/marketing/ClarityMarketingScript";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { SalesHero } from "@/components/marketing/SalesHero";
import { HowItWorksMobile } from "@/components/marketing/HowItWorksMobile";
import { CustomerStepPhone } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { OwnerSurfacePhone } from "@/components/marketing/mockups/OwnerSurfacesMockups";
import {
  LineConfirmMockup,
  LineReminderMockup,
} from "@/components/marketing/mockups/LineReminderMockup";
import { PainStormVisual } from "@/components/marketing/mockups/PainStormVisual";
import { PhoneScreen } from "@/components/marketing/mockups/PhoneScreen";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";
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
const TRIAL_BOX_ITEMS = [1, 2, 3, 4] as const;
const BODY = "text-[15px] leading-relaxed text-zinc-300 md:text-base";
/** Never render testimonials in production until real reviews exist. */
const SHOW_TESTIMONIALS_PLACEHOLDER = false;

/**
 * Thai Pain copy: break only between phrase spans so compounds
 * (มือถือ, คิวเดียวกัน, …) never wrap mid-word. EN stays plain.
 * Spans are inert on desktop widths (phrases already fit).
 */
const PAIN_TH_PHRASES: Partial<Record<MessageKey, readonly string[]>> = {
  "marketing.pain.bullet1": ["ตอบแชทระหว่างตัดผม", "มือไม่ว่างก็ต้องหยิบมือถือ"],
  "marketing.pain.bullet2": ["คิวจดกระดาษ", "ไม่รู้ว่าช่างคนไหนว่าง"],
  "marketing.pain.bullet3": ["Walk-in ชนกับคิวที่จองไว้"],
  "marketing.pain.bullet4": ["ลูกค้าลืมนัดหรือรอนานจนกลับไป", "ไม่มีใครบันทึก"],
  "marketing.pain.punchline": ["ทุกคิวที่หายไปเงียบ ๆ", "คือค่าตัดผมที่ไม่ได้เก็บ"],
  "marketing.pain.close": ["ClipperQ ช่วยให้ลูกค้าจองเอง", "และให้ทั้งร้านเห็นคิวเดียวกัน"],
};

function PainCopy({ messageKey }: { messageKey: MessageKey }) {
  const { t, locale } = useI18n();
  const text = t(messageKey);
  if (locale !== "th") return <>{text}</>;
  const phrases = PAIN_TH_PHRASES[messageKey];
  if (!phrases?.length) {
    return <span className="[word-break:keep-all]">{text}</span>;
  }
  return (
    <>
      {phrases.map((phrase, i) => (
        <Fragment key={`${messageKey}-${i}`}>
          {i > 0 ? " " : null}
          <span className="whitespace-nowrap [word-break:keep-all]">{phrase}</span>
        </Fragment>
      ))}
    </>
  );
}

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

/** Final CTA micro: two balanced rows (tiers / features); never break mid-phrase. */
function FinalMicroLines({ text }: { text: string }) {
  const phrases = text.split(" · ");
  const tierPhrases = phrases.slice(0, 4);
  const featurePhrases = phrases.slice(4);
  const row = (parts: string[], keyPrefix: string) => (
    <span className="flex flex-wrap items-center justify-center">
      {parts.map((phrase, i) => (
        <Fragment key={`${keyPrefix}-${i}`}>
          {i > 0 ? (
            <span className="whitespace-nowrap px-1" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="whitespace-nowrap [word-break:keep-all]">{phrase}</span>
        </Fragment>
      ))}
    </span>
  );
  return (
    <p className="mx-auto mt-4 flex max-w-xl flex-col items-center gap-y-1 text-center text-[13px] leading-snug text-zinc-400 text-balance md:text-sm">
      {row(tierPhrases, "tier")}
      {featurePhrases.length > 0 ? row(featurePhrases, "feat") : null}
    </p>
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
  const supportLineUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  const heroCtaRef = useRef<HTMLDivElement | null>(null);
  const heroCtaDesktopRef = useRef<HTMLDivElement | null>(null);
  const finalCtaRef = useRef<HTMLElement | null>(null);
  const pricingRef = useRef<HTMLElement | null>(null);
  const lineSectionRef = useRef<HTMLElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaqIds, setOpenFaqIds] = useState<number[]>([]);

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  useEffect(() => {
    // Hide sticky while any in-page primary CTA is on screen, or the footer is in view.
    const hideEls = [
      ...document.querySelectorAll<HTMLElement>("[data-inpage-trial-cta]"),
      ...document.querySelectorAll<HTMLElement>("[data-hide-sticky]"),
    ];
    // Fallback: hero wrappers if attribute not yet on a wrapped block
    for (const el of [heroCtaRef.current, heroCtaDesktopRef.current]) {
      if (el && !hideEls.includes(el)) hideEls.push(el);
    }
    if (hideEls.length === 0) return;

    const visibleByEl = new Map<Element, boolean>();
    for (const el of hideEls) visibleByEl.set(el, false);

    const sync = () => {
      const anyHideTargetVisible = [...visibleByEl.values()].some(Boolean);
      setShowSticky(!anyHideTargetVisible);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleByEl.set(entry.target, entry.isIntersecting);
        }
        sync();
      },
      { threshold: 0, rootMargin: "0px" },
    );
    for (const el of hideEls) obs.observe(el);
    // Observer delivers an initial callback with current intersection — no eager sync.

    return () => obs.disconnect();
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
      <SalesHero heroCtaRef={heroCtaRef} heroCtaDesktopRef={heroCtaDesktopRef} />

      {/* Pain — Option C: checklist (F-pattern) + notification storm over photo */}
      <section className="overflow-x-clip bg-zinc-950">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 md:px-16 lg:grid-cols-[50fr_44fr] lg:gap-x-[6fr] lg:px-20 lg:pb-16 lg:pt-[112px] xl:px-[120px]">
          <div className="order-2 lg:order-1">
            <h2 className="text-[2rem] font-extrabold leading-[1.28] tracking-tight sm:text-[2.5rem] lg:text-[58px] xl:text-[64px]">
              <span className="text-amber-300">
                <span className="text-zinc-50">“</span>
                {t("marketing.pain.titleLead")}
                <span className="text-zinc-50">”</span>
              </span>
              <br />
              <span className="text-zinc-50">{t("marketing.pain.titleRest")}</span>
            </h2>

            <ul className="mt-10 lg:mt-10">
              {PAIN_BULLETS.map((n, i) => (
                <li
                  key={n}
                  className={`flex items-start gap-3.5 py-[18px] ${
                    i < PAIN_BULLETS.length - 1 ? "border-b border-zinc-800" : ""
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-amber-300 text-zinc-950"
                    aria-hidden
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <p className="text-[1.05rem] font-semibold leading-[1.45] text-zinc-50 sm:text-lg lg:text-[22px]">
                    <PainCopy messageKey={`marketing.pain.bullet${n}` as MessageKey} />
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <div className="h-px w-12 bg-amber-300" aria-hidden />
              <p className="mt-5 text-xl font-extrabold leading-[1.35] tracking-tight text-amber-300 sm:text-2xl lg:text-[32px]">
                <PainCopy messageKey="marketing.pain.punchline" />
              </p>
              <p className="mt-3 max-w-md text-base leading-[1.5] text-zinc-300 lg:text-xl">
                <PainCopy messageKey="marketing.pain.close" />
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <PainStormVisual
              messages={painMessages}
              times={painTimes}
              unreadLabel={t("marketing.pain.unreadBadge")}
              alt={t("marketing.pain.photoAlt")}
            />
          </div>
        </div>
        {/* Hand-off fade into solution section */}
        <div
          className="pointer-events-none h-[80px] bg-gradient-to-b from-transparent to-[#111113] lg:h-[120px]"
          aria-hidden
        />
      </section>

      {/* LINE Signature — desktop-first relief: airy, fewer boxes */}
      <section
        id="line-messages"
        ref={lineSectionRef}
        className="scroll-mt-20 overflow-x-clip bg-gradient-to-b from-zinc-950 via-zinc-900/35 to-zinc-950"
      >
        <div className="relative mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-24 xl:px-12 xl:py-28">
          <header className="relative z-10 max-w-3xl">
            <p className="text-sm font-medium tracking-wide text-amber-300/80 lg:text-[15px]">
              {t("marketing.line.eyebrow")}
            </p>
            <h2 className="mt-4 text-[1.75rem] font-bold leading-[1.3] tracking-tight text-zinc-50 sm:text-3xl md:text-[2.35rem] lg:text-[2.75rem] lg:leading-[1.25] xl:text-[3rem]">
              {t("marketing.line.title")}
            </h2>
          </header>

          <div className="relative mt-14 grid items-start gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-16 xl:mt-20 xl:gap-20">
            {/* Option B mobile: mood plate behind copy (unchanged) */}
            {marketingPhotoSlots.solutionCustomer.src ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-1 z-0 flex h-[400px] items-start justify-center opacity-[0.88] sm:h-[440px] lg:hidden"
              >
                <div
                  className="relative mt-2 aspect-square w-[88%] max-w-[360px] overflow-hidden"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0%, #000 8%, #000 48%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.1) 88%, transparent 100%)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, #000 8%, #000 48%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.1) 88%, transparent 100%)",
                  }}
                >
                  <Image
                    src={marketingPhotoSlots.solutionCustomer.src}
                    alt=""
                    fill
                    sizes="90vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}

            <div className="relative z-10 order-2 flex flex-col items-center gap-6 lg:order-1 lg:h-full lg:items-stretch lg:gap-10 xl:gap-12">
              {/* Same phones row as 36871e6 — w-full so fluid mocks don't collapse under items-start */}
              <div className="flex w-full shrink-0 flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-center lg:justify-start lg:gap-5 xl:gap-7">
                {/* Option A · Warm Note — real confirm + reminder Flex (same tokens/copy as builders) */}
                <LineConfirmMockup shopName="ClipperQ Demo" />
                <LineReminderMockup
                  shopName="ClipperQ Demo"
                  whenLabel={t("marketing.line.mockWhen")}
                />
              </div>

              {/* Desktop: mood beside evidence/cost — below phones, larger, soft all-edge fade */}
              {marketingPhotoSlots.solutionCustomer.src ? (
                <div
                  aria-hidden
                  className="pointer-events-none relative mt-auto hidden w-full max-w-[420px] self-start opacity-[0.97] lg:block xl:max-w-[460px]"
                >
                  <div
                    className="relative aspect-square w-full"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 12%, #000 28%, #000 55%, rgba(0,0,0,0.45) 78%, transparent 100%)",
                      maskImage:
                        "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 12%, #000 28%, #000 55%, rgba(0,0,0,0.45) 78%, transparent 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        WebkitMaskImage:
                          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 14%, #000 32%, #000 72%, rgba(0,0,0,0.35) 90%, transparent 100%)",
                        maskImage:
                          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 14%, #000 32%, #000 72%, rgba(0,0,0,0.35) 90%, transparent 100%)",
                      }}
                    >
                      <Image
                        src={marketingPhotoSlots.solutionCustomer.src}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 28vw, 34vw"
                        className="object-cover object-[62%_42%]"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative z-10 order-1 max-w-xl lg:order-2 lg:max-w-[22rem] lg:pt-1 xl:max-w-[24rem]">
              {/* Text-only scrim — denser under copy only; photo beyond stays bright */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-6 -inset-y-3 lg:-inset-x-8 lg:-inset-y-5"
                style={{
                  background:
                    "radial-gradient(ellipse 95% 85% at 32% 40%, rgba(9,9,11,0.98) 0%, rgba(9,9,11,0.92) 52%, rgba(9,9,11,0.35) 74%, transparent 90%)",
                }}
              />
              <div className="relative space-y-8">
                {lineBullets.map((key) => (
                  <p
                    key={key}
                    className="flex gap-3.5 text-base leading-[1.65] text-zinc-300 md:text-[1.0625rem] lg:text-lg lg:leading-[1.6]"
                  >
                    <Check size={20} className="mt-1 shrink-0 text-amber-400/90" />
                    <span>{td(key as MessageKey)}</span>
                  </p>
                ))}
              </div>

              {marketingClaims.reminderShortLeads ? (
                <p className="relative mt-10 text-base leading-[1.65] text-zinc-400 lg:text-[1.0625rem]">
                  <span className="font-medium text-zinc-200">
                    {t("marketing.line.leadsLabel")}
                  </span>
                  <span className="mt-1.5 block text-zinc-400">
                    {(
                      [
                        "marketing.line.lead1d",
                        "marketing.line.lead3h",
                        "marketing.line.lead1h",
                        "marketing.line.lead30m",
                        "marketing.line.leadNone",
                      ] as const
                    )
                      .map((key) => t(key))
                      .join(" · ")}
                  </span>
                </p>
              ) : null}

              {marketingClaims.customerSelfReschedule ? (
                <p className="relative mt-6 flex gap-3 text-base leading-[1.65] text-zinc-400 lg:text-[1.0625rem]">
                  <CalendarClock size={18} className="mt-1 shrink-0 text-amber-400/80" />
                  <span>
                    <span className="font-medium text-zinc-200">
                      {t("marketing.line.rescheduleTitle")}
                    </span>
                    <span className="mt-1 block">{t("marketing.line.rescheduleBody")}</span>
                  </span>
                </p>
              ) : null}

              <div className="relative mt-12 flex w-full max-w-[440px] flex-col items-stretch gap-3 sm:items-start">
                <PrimaryTrialCta
                  labelKey="marketing.line.cta"
                  placement="line"
                  className="w-full justify-center text-center sm:w-auto sm:justify-start sm:text-left"
                />
                <LineCta
                  label={t("marketing.line.lineCta")}
                  className="w-full sm:w-auto"
                  placement="line"
                />
              </div>

              <div className="relative mt-12 space-y-3 border-t border-zinc-800/80 pt-8">
                <p className="max-w-md text-xs leading-relaxed text-zinc-400 lg:text-[13px]">
                  {t("marketing.line.evidence")}
                </p>
                <p className="max-w-md text-xs leading-relaxed text-zinc-400 lg:text-[13px]">
                  <span className="font-medium text-zinc-300">
                    {td("marketing.line.costTitle")}
                  </span>
                  {" · "}
                  {td("marketing.line.costBody")}{" "}
                  <span className="text-zinc-300">{td("marketing.line.costClose")}</span>
                </p>
              </div>
            </div>
          </div>

          <figure className="mt-20 xl:mt-24">
            {/* Desktop: callout above the row so phone top/bottom can match the photo */}
            <p className="mb-3 hidden text-xs font-medium tracking-wide text-amber-300/85 lg:block lg:text-[13px]">
              {t("marketing.line.queueBoardCallout")}
            </p>
            <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-10 xl:gap-12">
              {/* Magnified admin queue callout — phone in the photo is too small to read */}
              <div className="relative w-full max-w-[220px] sm:max-w-[240px] lg:flex lg:h-full lg:w-auto lg:max-w-none lg:items-stretch">
                <p className="mb-3 text-center text-xs font-medium tracking-wide text-amber-300/85 lg:hidden">
                  {t("marketing.line.queueBoardCallout")}
                </p>
                {/* Mobile: width-capped fluid phone. Desktop: match photo row height via grid stretch */}
                <div className="w-full lg:hidden">
                  <PhoneScreen screen="adminQueue" fluid />
                </div>
                <div className="hidden h-full lg:block lg:aspect-[390/844]">
                  <PhoneScreen screen="adminQueue" matchHeight />
                </div>
              </div>
              <MarketingPhotoSlot
                slot="solutionBarberCalm"
                alt={t("marketing.line.barberPhotoAlt")}
                sizes="(min-width: 1440px) 1000px, (min-width: 1280px) 900px, 92vw"
                className="w-full min-w-0"
              />
            </div>
            <figcaption className="mt-5 text-center text-sm text-zinc-500 lg:text-base">
              {t("marketing.line.barberCaption")}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* How it works — mobile compact tabs; desktop 3-column unchanged */}
      <section
        id="how-it-works"
        className="scroll-mt-20 overflow-x-clip bg-gradient-to-b from-zinc-950 via-zinc-900/25 to-zinc-950"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <HowItWorksMobile />

          <div className="hidden md:block">
            <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">
              {t("marketing.how.title")}
            </h2>
            <ol className="mt-8 grid gap-10 lg:grid-cols-3 lg:items-stretch lg:gap-6">
              {([1, 2, 3] as const).map((n) => {
                const Icon = HOW_ICONS[n - 1];
                return (
                  <li key={n} className="flex h-full flex-col items-center text-center">
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
                    {/* mt-auto keeps phone bezels aligned across columns (right was sitting low) */}
                    <div className="mt-5 w-full lg:mt-auto lg:pt-5">
                      <CustomerStepPhone step={n} />
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-8 text-center text-[15px] leading-relaxed text-zinc-300 md:text-base">
              {t("marketing.how.micro")}
            </p>
          </div>
        </div>
      </section>

      {/* Board — barbers / front desk. Mobile A: H2 → plate → bullets; desktop unchanged two-col. */}
      <section id="board" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.board.title")}
            </h2>
            {/* Mobile: barberMobile plate under H2 — near full column, shorter crop toward tablet/board */}
            <MarketingPhotoSlot
              slot="barberMobile"
              alt={t("marketing.board.photoAlt")}
              fill
              objectPosition="58% 34%"
              sizes="92vw"
              className="mt-5 h-[330px] w-full lg:hidden"
            />
            <ul className="mt-5 space-y-3.5 lg:mt-6 lg:space-y-4">
              {([1, 2, 3, 4, 5] as const).map((n) => {
                const Icon = BOARD_ICONS[n - 1];
                return (
                  <li key={n} className="flex gap-2.5 lg:gap-3">
                    <Icon
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-400"
                      strokeWidth={2}
                    />
                    <div>
                      <p className="text-[15px] font-semibold leading-snug text-zinc-50 md:text-base">
                        {t(`marketing.board.${n}.title` as MessageKey)}
                      </p>
                      <p className="mt-0.5 text-[14px] leading-relaxed text-zinc-300 md:mt-1 md:text-base">
                        {t(`marketing.board.${n}.desc` as MessageKey)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Desktop: Tommy iPad plate + live admin queue composite (unchanged). */}
          <div className="hidden justify-end lg:flex">
            <MarketingPhotoSlot
              slot="barberDesktop"
              alt={t("marketing.board.photoAlt")}
              sizes="(min-width: 1280px) 560px, 480px"
              className="w-full max-w-[560px]"
            />
          </div>
        </div>
      </section>

      {/* Owner stats — mobile C: compact phone, metric chips, sticky clearance; desktop unchanged */}
      <section id="owner" className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto grid max-w-[1280px] items-center gap-4 px-4 pt-10 pb-40 md:gap-8 md:px-6 md:py-14 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.owner.title")}
            </h2>
            <p className={`mt-4 ${BODY}`}>{t("marketing.owner.body")}</p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 lg:mt-5 lg:flex-col lg:items-start lg:gap-y-2">
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
            <figcaption className="mt-2 text-center text-sm text-zinc-400 md:mt-3">
              {t("marketing.owner.caption")}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Founder — mobile B: centered stack, ~176px photo, amber eyebrow; desktop (sm+) unchanged */}
      <section id="founder" className="scroll-mt-20 overflow-x-clip">
        <div
          className={`mx-auto max-w-[800px] px-4 pt-10 md:px-6 md:py-14 ${
            process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL
              ? "pb-36 md:pb-14"
              : "pb-10"
          }`}
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
            <MarketingPhotoSlot
              slot="founder"
              alt={t("marketing.founder.photoAlt")}
              shape="circle"
              sizes="176px"
              className="h-44 w-44 shrink-0 aspect-square sm:h-40 sm:w-40"
            />
            <div className="text-center sm:text-left">
              <p className="mb-1.5 text-sm font-medium text-amber-400/90 sm:hidden">
                {t("marketing.founder.eyebrow")}
              </p>
              <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">
                {t("marketing.founder.title")}
              </h2>
              <p className={`mt-3 ${BODY}`}>{td("marketing.founder.body")}</p>
              {process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL ? (
                <div className="mt-4 flex justify-center sm:justify-start">
                  <LineCta
                    label={t("marketing.founder.cta")}
                    placement="founder"
                  />
                </div>
              ) : null}
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

      {/* Pricing — mobile C: single price table; lg+ keeps three-card layout unchanged */}
      <section id="pricing" ref={pricingRef} className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-36 md:px-6 md:py-14 lg:pb-14">
          <p className="text-sm font-medium text-amber-400/90">
            {t("marketing.pricing.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-snug text-zinc-50 md:text-3xl">
            {td("marketing.pricing.title")}
          </h2>
          <p className={`mt-3 max-w-2xl ${BODY}`}>{td("marketing.pricing.support")}</p>

          {/* Mobile: direction C price table */}
          <div className="mt-8 lg:hidden">
            <div className="overflow-hidden rounded-2xl border border-zinc-700">
              {marketingOffer.tiers.map((tier) => {
                const isStarter = tier.id === "tier1";
                return (
                  <div
                    key={tier.id}
                    className={`flex min-h-[52px] items-center justify-between gap-3 px-4 py-3.5 ${
                      isStarter
                        ? "border-b border-zinc-800 bg-amber-400/[0.08]"
                        : "border-b border-zinc-800"
                    }`}
                  >
                    <p
                      className={`text-[15px] font-semibold leading-snug ${
                        isStarter ? "text-amber-200" : "text-zinc-50"
                      }`}
                    >
                      {tierBarberRangeLabel(tier, locale)}
                      {isStarter ? (
                        <span className="font-medium text-amber-400/90">
                          {" "}
                          · {t("marketing.pricing.tier1Badge")}
                        </span>
                      ) : null}
                    </p>
                    <p className="shrink-0 text-base font-bold text-amber-400">
                      {tierPricePerMonthLabel(tier, locale)}
                    </p>
                  </div>
                );
              })}
              {supportLineUrl ? (
                <a
                  href={supportLineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackMarketingEvent("support_line_click", {
                      cta_location: "pricing",
                    })
                  }
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-800/70 active:bg-zinc-800"
                >
                  <p className="text-[15px] font-semibold leading-snug text-zinc-50">
                    {t("marketing.pricing.contactRange")}
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-base font-bold text-amber-400">
                    {t("marketing.pricing.contactTitle")}
                    <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
                  </span>
                </a>
              ) : (
                <div className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3.5">
                  <p className="text-[15px] font-semibold leading-snug text-zinc-50">
                    {t("marketing.pricing.contactRange")}
                  </p>
                  <span className="shrink-0 text-base font-bold text-amber-400">
                    {t("marketing.pricing.contactTitle")}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 text-sm leading-snug text-zinc-400">
              {t("marketing.pricing.tierSameFeatures")}
            </p>
            <ul className="mt-3 space-y-2">
              {PRICING_INCLUDES.map((n) => (
                <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                  <Check size={16} className="mt-1 shrink-0 text-amber-400" />
                  {t(`marketing.pricing.include${n}` as MessageKey)}
                </li>
              ))}
            </ul>
            <div className="mt-5">
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

          {/* Desktop (lg+): three-card layout unchanged */}
          <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-3">
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

          <div className="mt-4 hidden items-center justify-between gap-4 rounded-2xl border border-zinc-700 bg-zinc-950/40 p-5 md:p-6 lg:flex">
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
          <div className="mt-10 overflow-visible rounded-2xl border border-amber-500/30 bg-amber-400/5 p-5 md:p-7">
            <h3 className="text-xl font-bold leading-snug text-zinc-50">
              {td("marketing.trialBox.title")}
            </h3>
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

      {/* FAQ — mobile A: compact accordion + sticky clearance; desktop spacing restored at md+ */}
      <section id="faq" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-36 md:px-6 md:py-14 lg:pb-14">
          <div className="mx-auto max-w-[800px]">
            <p className="text-sm font-medium text-amber-400/90">{t("marketing.faq.eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-50 md:text-3xl">
              {t("marketing.faq.title")}
            </h2>
            <div className="mt-5 space-y-1.5 md:mt-8 md:space-y-3">
              {FAQ_ITEMS.map((n) => {
                const open = openFaqIds.includes(n);
                const panelId = `faq-panel-${n}`;
                const buttonId = `faq-button-${n}`;
                return (
                  <div
                    key={n}
                    className={`rounded-lg border bg-zinc-900/40 px-3 md:rounded-xl md:bg-zinc-900/50 md:px-4 ${
                      open
                        ? "border-amber-500/30 pb-3 md:pb-4"
                        : "border-zinc-800"
                    }`}
                  >
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex min-h-12 w-full cursor-pointer items-center gap-2 py-1.5 text-left text-zinc-50 md:min-h-14 md:gap-3 md:py-2"
                      onClick={() => {
                        const willOpen = !openFaqIds.includes(n);
                        setOpenFaqIds((prev) =>
                          willOpen ? [...prev, n] : prev.filter((id) => id !== n),
                        );
                        if (willOpen) {
                          trackMarketingEvent("faq_open", { faq_id: String(n) });
                        }
                      }}
                    >
                      <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug md:text-base">
                        {td(`marketing.faq.${n}.q` as MessageKey)}
                      </span>
                      <ChevronDown
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden
                        className={`shrink-0 text-amber-400 transition-transform duration-200 ${
                          open ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      hidden={!open}
                      className={open ? "pb-1" : undefined}
                    >
                      <p className={BODY}>{td(`marketing.faq.${n}.a` as MessageKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — mobile B: shorter headline/sub, dual CTAs, full-tier micro */}
      <section
        ref={finalCtaRef}
        className="overflow-x-clip border-t border-amber-500/20 bg-zinc-900/60"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-12 text-center md:px-6 md:py-16">
          <h2 className="text-[1.375rem] font-bold leading-snug text-zinc-50 sm:text-2xl md:text-4xl md:leading-tight">
            {t("marketing.final.title")}
          </h2>
          <p className={`mx-auto mt-3 max-w-xl ${BODY}`}>{t("marketing.final.sub")}</p>
          <div className="mx-auto mt-7 flex w-full max-w-[480px] flex-col gap-2.5 md:mt-8 md:gap-3">
            <PrimaryTrialCta
              labelKey="marketing.final.cta"
              placement="final"
              fullWidth
              riskClassName="mt-3 justify-center text-[13px] sm:text-sm"
            />
            <LineCta label={t("marketing.final.lineCta")} className="w-full" placement="final" />
          </div>
          <FinalMicroLines text={td("marketing.final.micro")} />
        </div>
      </section>

      <MarketingFooter />

      {/* Sticky mobile CTA — soft gradient scrim (no hard top band); fades out when any in-page CTA is visible */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-14 transition-[opacity,transform] duration-300 ease-out md:hidden ${
          showSticky
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(9,9,11,0.98) 0%, rgba(9,9,11,0.9) 28%, rgba(9,9,11,0.55) 52%, rgba(9,9,11,0.18) 78%, transparent 100%)",
        }}
        aria-hidden={!showSticky}
      >
        <PrimaryTrialCta
          labelKey="marketing.sticky.cta"
          placement="sticky"
          eventName="sticky_cta_click"
          fullWidth
          riskClassName="mt-2 justify-center text-[13px] sm:text-sm"
        />
      </div>
    </div>
  );
}
