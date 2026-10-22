"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { ScheduleBoardMockup } from "@/components/marketing/mockups/ScheduleBoardMockup";
import {
  HOW_DEMO_BOOKING,
  WarmNoteFlexCard,
} from "@/components/marketing/mockups/WarmNoteFlexCard";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import { fillOfferCopy, marketingClaims } from "@/lib/marketing/offer";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";

/**
 * LINE signature section — progressive reveal (IO ~0.3, once).
 * Content stays fully visible until JS opts in; reduced-motion = instant.
 */
const LINE_BULLETS = [
  "marketing.line.bullet1",
  "marketing.line.bullet2",
  ...(marketingClaims.customerSelfReschedule
    ? (["marketing.line.bullet3"] as const)
    : []),
] as const;

function LineGhostCta({ label, placement }: { label: string; placement: string }) {
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  if (!supportUrl) return null;
  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMarketingEvent("support_line_click", { cta_location: placement })}
      className="inline-flex min-h-11 items-center justify-center px-1 py-2 text-[15px] font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-amber-300 hover:underline sm:min-h-12"
    >
      {label}
    </a>
  );
}

function SampleChatBubble({
  variant,
  whenLabel,
  revealDelayMs,
}: {
  variant: "confirm" | "reminder";
  whenLabel?: string;
  revealDelayMs: number;
}) {
  const { t } = useI18n();
  return (
    <div
      aria-hidden
      data-line-reveal="bubble"
      style={
        {
          ["--line-delay" as string]: `${revealDelayMs}ms`,
          ["--line-dur" as string]: "450ms",
        } as CSSProperties
      }
      className="mx-auto w-full max-w-[280px] lg:mx-0"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded-md border border-amber-500/40 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-200">
          {t("marketing.try.sampleBadge")}
        </span>
        {whenLabel ? (
          <span className="text-[11px] text-zinc-500">{whenLabel}</span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl rounded-tl-md border border-zinc-700/60 bg-[#8CABD0]/25 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <WarmNoteFlexCard
          variant={variant}
          shopName={HOW_DEMO_BOOKING.shopName}
          barberName={HOW_DEMO_BOOKING.barberName}
          date={HOW_DEMO_BOOKING.date}
          time={HOW_DEMO_BOOKING.time}
          bookingCode={HOW_DEMO_BOOKING.bookingCode}
          className="shadow-none"
        />
      </div>
    </div>
  );
}

export function LineReliefSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  // fillOfferCopy substitutes {quota} from marketingOffer.lineFreePushQuota (300)
  const evidenceFilled = fillOfferCopy(t("marketing.line.evidence"));
  const evidence = /\{[a-zA-Z_]+\}/.test(evidenceFilled) ? null : evidenceFilled;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const markAllIn = () => {
      el.dataset.lineReliefIn = "";
      for (const node of el.querySelectorAll<HTMLElement>("[data-line-reveal]")) {
        node.dataset.lineRevealIn = "";
      }
      setRevealed(true);
    };

    if (mq.matches) {
      markAllIn();
      return;
    }

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      document.documentElement.dataset.cqLineRelief = "on";
      // Next frame so the pre-hide styles apply before we flip to "in"
      requestAnimationFrame(() => {
        el.dataset.lineReliefIn = "";
        for (const node of el.querySelectorAll<HTMLElement>("[data-line-reveal]")) {
          node.dataset.lineRevealIn = "";
        }
        setRevealed(true);
      });
      trackMarketingEvent("line_section_view");
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      delete document.documentElement.dataset.cqLineRelief;
    };
  }, []);

  // Heading 500ms; bullets start ~400ms, 180ms apart, ~420ms each; checks +120ms; CTA last.
  // Sequence finishes under 1.5s.
  const headingDelay = 0;
  const bulletBase = 400;
  const bulletStagger = 180;
  const bubbleDelay = 520;
  const ctaDelay = 1050;

  return (
    <section
      id="line-messages"
      ref={sectionRef}
      data-line-relief=""
      data-line-revealed={revealed ? "true" : undefined}
      className="scroll-mt-20 overflow-x-clip bg-zinc-950"
    >
      {/* Mobile: smiling customer photo on top (~40vh), face bright — no text over photo */}
      {marketingPhotoSlots.solutionCustomer.src ? (
        <div className="relative isolate h-[40vh] min-h-[220px] w-full overflow-hidden lg:hidden">
          <Image
            src={marketingPhotoSlots.solutionCustomer.src}
            alt={t("marketing.line.customerPhotoAlt")}
            fill
            sizes="100vw"
            className="object-cover object-[center_20%] brightness-[1.08] contrast-[1.04]"
            priority={false}
          />
          {/* Warm gold radial glow (8–12% opacity) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(251,191,36,0.1) 0%, transparent 65%)",
            }}
          />
          {/* Gradient transparent → black on bottom half only */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-zinc-950"
          />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20 xl:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20">
          {/* Copy column — solid text on dark ground, contrast ≥4.5:1 */}
          <div className="order-1 max-w-xl lg:max-w-none">
            <p
              data-line-reveal="eyebrow"
              style={
                {
                  ["--line-delay" as string]: `${headingDelay}ms`,
                  ["--line-dur" as string]: "500ms",
                } as CSSProperties
              }
              className="text-[13px] font-medium tracking-wide text-amber-300 sm:text-sm"
            >
              {t("marketing.line.eyebrow")}
            </p>
            <h2
              data-line-reveal="heading"
              style={
                {
                  ["--line-delay" as string]: `${headingDelay}ms`,
                  ["--line-dur" as string]: "500ms",
                } as CSSProperties
              }
              className="mt-3 max-w-[20ch] text-[26px] font-bold leading-[1.35] tracking-tight text-zinc-50 text-balance sm:text-[27px] md:text-[28px] md:max-w-none"
            >
              {t("marketing.line.title")}
            </h2>

            <ul className="mt-8 space-y-4 md:space-y-5">
              {LINE_BULLETS.map((key, i) => {
                const textDelay = bulletBase + i * bulletStagger;
                const checkDelay = textDelay + 120;
                return (
                  <li key={key} className="flex items-start gap-3">
                    <span
                      data-line-reveal="check"
                      style={
                        {
                          ["--line-delay" as string]: `${checkDelay}ms`,
                          ["--line-dur" as string]: "350ms",
                        } as CSSProperties
                      }
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      <Check size={20} strokeWidth={2.75} className="text-amber-400" />
                    </span>
                    <p
                      data-line-reveal="bullet"
                      style={
                        {
                          ["--line-delay" as string]: `${textDelay}ms`,
                          ["--line-dur" as string]: "420ms",
                        } as CSSProperties
                      }
                      className="text-base leading-snug text-zinc-200"
                    >
                      {t(key as MessageKey)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <p
              data-line-reveal="note"
              style={
                {
                  ["--line-delay" as string]: `${bulletBase + LINE_BULLETS.length * bulletStagger}ms`,
                  ["--line-dur" as string]: "400ms",
                } as CSSProperties
              }
              className="mt-5 text-sm leading-relaxed text-zinc-400"
            >
              {t("marketing.line.toggleNote")}
            </p>

            {/* Mobile chat bubbles under checklist — centered; desktop column keeps start align */}
            <div className="mt-8 flex flex-col items-center gap-5 lg:hidden">
              <SampleChatBubble variant="confirm" revealDelayMs={bubbleDelay} />
              <SampleChatBubble
                variant="reminder"
                whenLabel={t("marketing.line.mockWhen")}
                revealDelayMs={bubbleDelay + 160}
              />
            </div>

            <div
              data-line-reveal="cta"
              style={
                {
                  ["--line-delay" as string]: `${ctaDelay}ms`,
                  ["--line-dur" as string]: "400ms",
                } as CSSProperties
              }
              className="mx-auto mt-10 flex w-full max-w-[440px] flex-col items-center gap-2 lg:mx-0 lg:items-start"
            >
              <PrimaryTrialCta
                labelKey="marketing.line.cta"
                placement="line"
                className="w-full justify-center text-center sm:w-auto sm:justify-start sm:text-left"
              />
              <LineGhostCta label={t("marketing.line.lineCta")} placement="line" />
            </div>

            {evidence ? (
              <p
                data-line-reveal="evidence"
                style={
                  {
                    ["--line-delay" as string]: `${ctaDelay + 80}ms`,
                    ["--line-dur" as string]: "400ms",
                  } as CSSProperties
                }
                className="mt-8 max-w-md border-t border-zinc-800/80 pt-6 text-[13px] leading-relaxed text-zinc-400"
              >
                {evidence}
              </p>
            ) : null}
          </div>

          {/* Desktop: photo + bubbles — text never overlays the photo */}
          <div className="order-2 hidden lg:flex lg:flex-col lg:gap-8">
            {marketingPhotoSlots.solutionCustomer.src ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
                <Image
                  src={marketingPhotoSlots.solutionCustomer.src}
                  alt={t("marketing.line.customerPhotoAlt")}
                  fill
                  sizes="(min-width: 1024px) 560px, 50vw"
                  className="object-cover object-[center_22%] brightness-[1.06]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 65% 50% at 50% 30%, rgba(251,191,36,0.09) 0%, transparent 70%)",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-zinc-950/80"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-start gap-4">
              <SampleChatBubble variant="confirm" revealDelayMs={bubbleDelay} />
              <SampleChatBubble
                variant="reminder"
                whenLabel={t("marketing.line.mockWhen")}
                revealDelayMs={bubbleDelay + 160}
              />
            </div>
          </div>
        </div>

        {/* Shop calm evidence — schedule zoom + barber photo */}
        <figure className="mt-16 xl:mt-20">
          <p className="mb-3 hidden text-xs font-medium tracking-wide text-amber-300/85 lg:block lg:text-[13px]">
            {t("marketing.line.queueBoardCallout")}
          </p>
          <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-10 xl:gap-12">
            <div className="relative w-full max-w-[220px] sm:max-w-[240px] lg:flex lg:h-full lg:w-auto lg:max-w-none lg:items-stretch">
              <p className="mb-3 text-center text-xs font-medium tracking-wide text-amber-300/85 lg:hidden">
                {t("marketing.line.queueBoardCallout")}
              </p>
              <div className="w-full lg:hidden">
                <ScheduleBoardMockup fluid />
              </div>
              <div className="hidden h-full lg:block lg:aspect-[390/844]">
                <ScheduleBoardMockup matchHeight />
              </div>
              <p className="mt-2 text-center text-[12px] leading-snug text-zinc-400 lg:mt-3">
                {t("marketing.line.scheduleTabNote")}
              </p>
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
  );
}
