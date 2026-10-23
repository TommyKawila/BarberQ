"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  QrCode,
  Users,
  XCircle,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { ClarityMarketingScript } from "@/components/marketing/ClarityMarketingScript";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { SalesHero } from "@/components/marketing/SalesHero";
import { HowItWorksStrip } from "@/components/marketing/HowItWorksStrip";
import { LineReliefSection } from "@/components/marketing/LineReliefSection";
import { PainStormVisual } from "@/components/marketing/mockups/PainStormVisual";
import { TryBookingDemo } from "@/components/marketing/TryBookingDemo";
import { PainHammerTitle } from "@/components/marketing/PainHammerTitle";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";
import { useSalesPageReveal } from "@/hooks/useSalesPageReveal";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import {
  fillOfferCopy,
  marketingOffer,
  tierBarberRangeLabel,
  tierPricePerMonthLabel,
} from "@/lib/marketing/offer";

const DEMO_FEATURE_ICONS = [Users, QrCode, Bell, XCircle] as const;
const DEMO_FEATURE_KEYS = [
  "marketing.try.featureWalkin",
  "marketing.try.featureQr",
  "marketing.try.featurePush",
  "marketing.try.featureCancel",
] as const;
/** FAQ ordered by real objections (pricing → setup → LINE → app → message cost → …). */
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const PRICING_INCLUDES = [1, 2, 3, 4, 5] as const;
const PAIN_BULLETS = [1, 2, 3, 4] as const;
const TRIAL_BOX_ITEMS = [1, 2, 3] as const;
const BODY = "text-[15px] leading-relaxed text-zinc-300 md:text-base";
/** Never render testimonials in production until real reviews exist. */
const SHOW_TESTIMONIALS_PLACEHOLDER = false;

/**
 * Thai Pain copy: break only between phrase spans so compounds
 * (มือถือ, คิวเดียวกัน, …) never wrap mid-word. EN stays plain.
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

export function SalesPage({ heroScene }: { heroScene?: number } = {}) {
  const { t, locale } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));
  const supportLineUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const finalCtaRef = useRef<HTMLElement | null>(null);
  const pricingRef = useRef<HTMLElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaqIds, setOpenFaqIds] = useState<number[]>([]);

  useSalesPageReveal(pageRootRef);

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  useEffect(() => {
    // Hide sticky only while hero / pricing / final primary CTAs are on screen.
    const hideEls = [
      ...document.querySelectorAll<HTMLElement>("[data-inpage-trial-cta]"),
    ];
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

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const pricingEl = pricingRef.current;
    if (!pricingEl) return;
    let seen = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !seen) {
          seen = true;
          trackMarketingEvent("pricing_view");
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(pricingEl);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={pageRootRef}
      className={`min-h-full max-w-full overflow-x-clip bg-zinc-950 text-zinc-50 ${
        showSticky
          ? "pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-0"
          : "md:pb-0"
      }`}
    >
      <ClarityMarketingScript />
      <LiffCallbackRedirect />
      <AttributionCapture />

      {/* 1) Hero */}
      <SalesHero initialScene={heroScene} />

      {/* 2) Problem ≤1 screen */}
      <section className="overflow-x-clip bg-zinc-950">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-8 sm:px-8 md:px-16 lg:grid-cols-[50fr_44fr] lg:gap-x-[6fr] lg:px-20 lg:py-12 xl:px-[120px]">
          <div className="order-2 lg:order-1">
            <PainHammerTitle />

            <ul className="mx-auto mt-6 max-w-xs lg:mx-0 lg:mt-8 lg:max-w-none">
              {PAIN_BULLETS.map((n, i) => (
                <li
                  key={n}
                  data-reveal
                  style={{ ["--reveal-delay" as string]: i * 70 }}
                  className={`flex items-start gap-3.5 py-3 ${
                    i < PAIN_BULLETS.length - 1 ? "border-b border-zinc-800" : ""
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-amber-300 text-zinc-950"
                    aria-hidden
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <p className="text-[1.05rem] font-normal leading-[1.55] text-zinc-300 sm:text-lg lg:text-[20px] lg:leading-[1.5]">
                    <PainCopy messageKey={`marketing.pain.bullet${n}` as MessageKey} />
                  </p>
                </li>
              ))}
            </ul>

            <div data-reveal style={{ ["--reveal-delay" as string]: 120 }} className="mt-6">
              <div className="h-px w-12 bg-amber-300" aria-hidden />
              <p className="mt-4 text-xl font-extrabold leading-[1.35] tracking-tight text-amber-300 sm:text-2xl lg:text-[28px]">
                <PainCopy messageKey="marketing.pain.punchline" />
              </p>
              <p className="mt-2 max-w-md text-base leading-[1.5] text-zinc-300 lg:text-lg">
                <PainCopy messageKey="marketing.pain.close" />
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <PainStormVisual />
          </div>
        </div>
      </section>

      {/* 3) Demo — tabs ลูกค้า|ร้าน (queue board in ร้าน) */}
      <section
        id="try-booking"
        data-hide-sticky
        className="scroll-mt-[4.5rem] overflow-x-clip bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950 md:scroll-mt-20"
      >
        <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-16 md:px-6 md:py-14">
          <header data-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-amber-300/80">
              {t("marketing.try.eyebrow")}
            </p>
            <h2 className="mt-2 text-[1.75rem] font-bold leading-[1.3] text-zinc-50 md:text-3xl">
              {t("marketing.try.title")}
            </h2>
            <p className={`mx-auto mt-3 max-w-xl ${BODY}`}>{t("marketing.try.body")}</p>
            <p className="mt-3 inline-flex items-center rounded-lg border border-amber-500/35 bg-amber-400/10 px-3.5 py-1.5 text-[13px] font-medium text-amber-200">
              {t("marketing.try.disclaimer")}
            </p>
          </header>
          <div data-reveal className="mt-8 md:mt-10">
            <TryBookingDemo />
          </div>
          {/* Shop-side capabilities under demo (board is inside ร้าน tab) */}
          <ul
            data-reveal
            className="mx-auto mt-8 w-fit max-w-xl space-y-2.5 text-left md:mt-10"
          >
            {DEMO_FEATURE_KEYS.map((key, i) => {
              const Icon = DEMO_FEATURE_ICONS[i];
              return (
                <li key={key} className="flex items-start gap-2.5 text-[15px] leading-snug text-zinc-300">
                  <Icon size={18} className="mt-0.5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
                  <span>{t(key)}</span>
                </li>
              );
            })}
          </ul>
          <p id="owner" className="sr-only">
            {t("marketing.owner.title")}
          </p>
        </div>
      </section>

      {/* 4) What customers get in LINE */}
      <LineReliefSection />

      {/* 5) Start in 3 steps — owner view */}
      <section
        id="how-it-works"
        data-hide-sticky
        className="scroll-mt-[4.5rem] overflow-x-clip bg-gradient-to-b from-zinc-950 via-zinc-900/25 to-zinc-950 md:scroll-mt-20"
      >
        <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-10 md:px-6 md:py-14">
          <div data-reveal>
            <HowItWorksStrip />
          </div>
        </div>
      </section>

      {/* 6) Tommy + transparency / customer data */}
      <section id="founder" className="scroll-mt-20 overflow-x-clip">
        <div
          className={`mx-auto max-w-[800px] px-4 pt-10 md:px-6 md:py-14 ${
            process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL
              ? "pb-16 md:pb-14"
              : "pb-10"
          }`}
        >
          <div
            data-reveal
            className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8"
          >
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
              <h2 className="text-[1.75rem] font-bold text-zinc-50 md:text-3xl">
                {t("marketing.founder.title")}
              </h2>
              <p className={`mx-auto mt-3 max-w-[34ch] text-left sm:mx-0 sm:max-w-none ${BODY}`}>
                {td("marketing.founder.body")}
              </p>
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

      {/* 7) Pricing — one table all breakpoints */}
      <section id="pricing" ref={pricingRef} className="scroll-mt-20 overflow-x-clip bg-zinc-900/30">
        <div className="mx-auto max-w-[720px] px-4 pt-10 pb-16 md:px-6 md:py-14">
          <div data-reveal className="text-center">
            <p className="text-sm font-medium text-amber-400/90">
              {t("marketing.pricing.eyebrow")}
            </p>
            <h2 className="mt-2 text-[1.75rem] font-bold leading-snug text-zinc-50 md:text-3xl">
              {td("marketing.pricing.title")}
            </h2>
            <p className={`mx-auto mt-3 max-w-2xl ${BODY}`}>
              {t("marketing.pricing.tierSameFeatures")}
            </p>
            <p className="mt-2 text-center text-[13px] text-zinc-500 md:text-sm">
              {td("marketing.pricing.micro")}
            </p>
          </div>

          <div data-reveal className="mt-8">
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
                    <div className="min-w-0">
                      <p
                        className={`text-[15px] font-semibold leading-snug ${
                          isStarter ? "text-amber-200" : "text-zinc-50"
                        }`}
                      >
                        {tierBarberRangeLabel(tier, locale)}
                      </p>
                      {isStarter ? (
                        <p className="mt-0.5 text-[13px] font-medium leading-snug text-amber-400/90">
                          {t("marketing.pricing.tier1Badge")}
                        </p>
                      ) : null}
                    </div>
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

            <ul className="mt-4 space-y-2">
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
                showRisk={false}
              />
              <p className="mt-3 text-center text-sm leading-snug text-zinc-400">
                {td("marketing.pricing.riskLine")}
              </p>
            </div>
          </div>

          <div data-reveal="soft" className="mt-8 grid gap-6 sm:grid-cols-2">
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

          <div
            data-reveal
            className="mt-10 overflow-visible rounded-2xl border border-amber-500/30 bg-amber-400/5 p-5 md:p-7"
          >
            <h3 className="text-xl font-bold leading-snug text-zinc-50">
              {td("marketing.trialBox.title")}
            </h3>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {TRIAL_BOX_ITEMS.map((n) => (
                <li key={n} className={`flex items-start gap-2 ${BODY}`}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[12px] font-bold text-amber-300">
                    {n}
                  </span>
                  {t(`marketing.trialBox.item${n}` as MessageKey)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 8) FAQ — objections order; message cost / 300 quota here */}
      <section id="faq" className="scroll-mt-20 overflow-x-clip">
        <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-16 md:px-6 md:py-14">
          <div className="mx-auto max-w-[800px]">
            <div data-reveal>
              <p className="text-sm font-medium text-amber-400/90">{t("marketing.faq.eyebrow")}</p>
              <h2 className="mt-2 text-[1.75rem] font-bold text-zinc-50 md:text-3xl">
                {t("marketing.faq.title")}
              </h2>
            </div>
            <div className="mt-5 space-y-1.5 md:mt-8 md:space-y-3">
              {FAQ_ITEMS.map((n) => {
                const open = openFaqIds.includes(n);
                const panelId = `faq-panel-${n}`;
                const buttonId = `faq-button-${n}`;
                return (
                  <div
                    key={n}
                    data-reveal="soft"
                    style={{ ["--reveal-delay" as string]: Math.min(n - 1, 5) * 45 }}
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

      {/* 9) Final CTA + what happens next */}
      <section
        ref={finalCtaRef}
        className="overflow-x-clip border-t border-amber-500/20 bg-zinc-900/60"
      >
        <div
          data-reveal="emphasis"
          className="mx-auto max-w-[1280px] px-4 py-12 text-center md:px-6 md:py-16"
        >
          <h2 className="text-[1.75rem] font-bold leading-snug text-zinc-50 md:text-4xl md:leading-tight">
            {t("marketing.final.title")}
          </h2>
          <p className={`mx-auto mt-3 max-w-xl ${BODY}`}>{t("marketing.final.sub")}</p>
          <div className="mx-auto mt-7 flex w-full max-w-[480px] flex-col gap-2.5 md:mt-8 md:gap-3">
            <PrimaryTrialCta
              labelKey="marketing.final.cta"
              placement="final"
              fullWidth
              showRisk={false}
              showAfterClick
              afterClickClassName="text-center"
            />
            <LineCta label={t("marketing.final.lineCta")} className="w-full" placement="final" />
          </div>
          <FinalMicroLines text={td("marketing.final.micro")} />
        </div>
      </section>

      {/* 10) Footer with privacy/terms */}
      <MarketingFooter />

      {/* Sticky mobile CTA — hides when another CTA is on screen */}
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
          showRisk={false}
        />
      </div>
    </div>
  );
}
