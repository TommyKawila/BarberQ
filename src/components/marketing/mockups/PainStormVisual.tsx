"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";

/** Five chats in time order — pop 180ms apart (<1.2s total). */
const STORM_CARDS = [
  { text: "marketing.pain.chat1", time: "marketing.pain.chatTime1" },
  { text: "marketing.pain.chat2", time: "marketing.pain.chatTime2" },
  { text: "marketing.pain.chat3", time: "marketing.pain.chatTime3" },
  { text: "marketing.pain.chat4", time: "marketing.pain.chatTime4" },
  { text: "marketing.pain.chat5", time: "marketing.pain.chatTime5" },
] as const satisfies readonly { text: MessageKey; time: MessageKey }[];

const STAGGER_MS = 180;

function LineCard({
  text,
  time,
  overlap,
  revealIndex,
  animate,
}: {
  text: string;
  time: string;
  /** Cards 4–5: slight pile-up */
  overlap?: boolean;
  revealIndex: number;
  animate: boolean;
}) {
  return (
    <div
      data-pain-card
      data-pain-overlap={overlap ? "" : undefined}
      className={`flex min-h-14 w-full items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-zinc-900/90 py-2.5 pl-2 pr-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)] ${
        overlap ? "relative z-0 origin-top" : "relative z-10"
      } ${animate ? "pain-storm-card" : ""} ${
        overlap && !animate ? "-mt-2 scale-[0.97] opacity-70" : ""
      }`}
      style={
        animate
          ? ({
              ["--pain-card-delay" as string]: `${revealIndex * STAGGER_MS}ms`,
            } as { [key: string]: string })
          : undefined
      }
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold tracking-tight text-white"
        style={{ backgroundColor: "#06C755" }}
        aria-hidden
      >
        LINE
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-100">
        {text}
      </p>
      <span className="shrink-0 text-[12px] tabular-nums text-zinc-400">{time}</span>
    </div>
  );
}

/**
 * Problem-section chat storm — compact auto-height frame (no photo / empty aspect box).
 * Cards visible by default; JS stagger is transform-only enter (never opacity:0 pre-hide).
 */
export function PainStormVisual({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const html = document.documentElement;
    html.classList.add("js");

    if (reducedMotion) {
      setPlayed(true);
      return;
    }

    let done = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done) return;
        done = true;
        setPlayed(true);
        obs.disconnect();
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion]);

  const animate = !reducedMotion;

  return (
    <div
      ref={rootRef}
      data-pain-storm
      data-pain-storm-played={played ? "true" : undefined}
      aria-label={t("marketing.pain.photoAlt")}
      className={`relative w-full max-w-[420px] justify-self-center lg:max-w-none lg:justify-self-end ${className}`}
    >
      <div
        className="relative w-full rounded-[20px] p-4"
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header: title left · badge right (same row) */}
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-[16px] font-semibold leading-snug text-white">
            {t("marketing.pain.stormTitle")}
          </p>
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#E5484D] px-2.5 py-1 text-[12px] font-bold leading-none text-white">
            {t("marketing.pain.unreadBadge")}
          </span>
        </div>

        {/* 5 LINE cards — 8px gap; cards 4–5 overlap */}
        <div className="mt-3 flex flex-col gap-2" aria-hidden>
          {STORM_CARDS.map((card, i) => (
            <LineCard
              key={card.text}
              text={t(card.text)}
              time={t(card.time)}
              overlap={i >= 3}
              revealIndex={i}
              animate={animate}
            />
          ))}
        </div>

        <p className="mt-3 text-[13px] font-medium leading-snug text-[#E5484D]">
          {t("marketing.pain.stormUnread")}
        </p>

        <p className="mt-3 text-right text-[11px] font-medium tracking-wide text-zinc-500 sm:text-[12px]">
          {t("marketing.try.sampleBadge")}
        </p>
      </div>
    </div>
  );
}
