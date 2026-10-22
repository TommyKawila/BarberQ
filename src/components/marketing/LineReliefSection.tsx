"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { ScheduleBoardMockup } from "@/components/marketing/mockups/ScheduleBoardMockup";
import {
  HOW_DEMO_BOOKING,
  WarmNoteFlexCard,
} from "@/components/marketing/mockups/WarmNoteFlexCard";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { trackMarketingEvent } from "@/lib/marketing/events";
import { marketingClaims } from "@/lib/marketing/offer";

/**
 * LINE signature section — what customers get in LINE.
 * Progressive reveal (transform-only under html.js). No AI/stock photos.
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

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const html = document.documentElement;
    html.classList.add("js");

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
      return () => {
        html.classList.remove("js");
      };
    }

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      html.dataset.cqLineRelief = "on";
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
      delete html.dataset.cqLineRelief;
    };
  }, []);

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
      <div className="relative mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20 xl:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20">
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
              className="mt-3 max-w-[20ch] text-[26px] font-bold leading-[1.35] tracking-tight text-zinc-50 text-balance sm:text-[27px] md:max-w-none md:text-[28px]"
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
              <a
                href="#pricing"
                onClick={() =>
                  trackMarketingEvent("how_it_works_click", { cta_location: "line" })
                }
                className="inline-flex min-h-11 items-center justify-center text-[15px] font-medium text-amber-300 underline-offset-4 hover:underline"
              >
                {t("marketing.seePricing")}
              </a>
              <LineGhostCta label={t("marketing.line.lineCta")} placement="line" />
            </div>
          </div>

          <div className="order-2 hidden lg:flex lg:flex-col lg:gap-8">
            <div className="flex flex-wrap items-start gap-4">
              <SampleChatBubble variant="confirm" revealDelayMs={bubbleDelay} />
              <SampleChatBubble
                variant="reminder"
                whenLabel={t("marketing.line.mockWhen")}
                revealDelayMs={bubbleDelay + 160}
              />
            </div>
            <figure className="mt-2">
              <p className="mb-3 text-xs font-medium tracking-wide text-amber-300/85 lg:text-[13px]">
                {t("marketing.line.queueBoardCallout")}
              </p>
              <div className="relative w-full max-w-[240px]">
                <div className="aspect-[390/844]">
                  <ScheduleBoardMockup matchHeight />
                </div>
                <p className="mt-2 text-center text-[12px] leading-snug text-zinc-400">
                  {t("marketing.line.scheduleTabNote")}
                </p>
              </div>
            </figure>
          </div>
        </div>

        {/* Mobile board sample */}
        <figure className="mt-12 flex flex-col items-center lg:hidden">
          <p className="mb-3 text-center text-xs font-medium tracking-wide text-amber-300/85">
            {t("marketing.line.queueBoardCallout")}
          </p>
          <div className="w-full max-w-[220px] sm:max-w-[240px]">
            <ScheduleBoardMockup fluid />
          </div>
          <p className="mt-2 text-center text-[12px] leading-snug text-zinc-400">
            {t("marketing.line.scheduleTabNote")}
          </p>
        </figure>
      </div>
    </section>
  );
}
