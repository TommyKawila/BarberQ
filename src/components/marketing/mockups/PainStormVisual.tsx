"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";

const MAX_VISIBLE = 3;
/** Rapid cadence so the storm feels annoying / overwhelming. */
const POP_INTERVAL_MS = 780;

type VisibleBubble = {
  id: number;
  text: string;
  time: string;
};

function LineBubble({
  text,
  time,
  opacity = 1,
  className = "",
}: {
  text: string;
  time: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex h-12 w-[300px] max-w-[calc(100%-24px)] items-center gap-2.5 rounded-2xl border border-zinc-700/50 bg-zinc-900/88 pl-2 pr-3 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:w-full lg:max-w-none ${className}`}
      style={{ opacity }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold tracking-tight text-white"
        style={{ backgroundColor: "#06C755" }}
      >
        LINE
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-100 lg:text-[16px]">
        {text}
      </p>
      <span className="shrink-0 text-[12px] tabular-nums text-zinc-400 lg:text-[13px]">
        {time}
      </span>
    </div>
  );
}

function bubbleOpacity(index: number, total: number): number {
  if (total <= 1) return 1;
  if (index === total - 1) return 1;
  if (index === total - 2) return 0.88;
  return 0.72;
}

/** Option C — photo with 99+ badge + cycling LINE notification storm. */
export function PainStormVisual({
  messages,
  times,
  unreadLabel,
  alt,
  className = "",
}: {
  messages: string[];
  times: string[];
  unreadLabel: string;
  alt: string;
  className?: string;
}) {
  const slot = marketingPhotoSlots.painBarber;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const nextIdxRef = useRef(0);
  const idRef = useRef(0);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState<VisibleBubble[]>([]);
  const [badgeKey, setBadgeKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion || messages.length === 0) return;

    const pushNext = () => {
      const i = nextIdxRef.current % messages.length;
      nextIdxRef.current += 1;
      const id = ++idRef.current;
      const text = messages[i] ?? "";
      const time = times[i % Math.max(times.length, 1)] ?? "";
      setVisible((prev) => {
        const next = [...prev, { id, text, time }];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
      setBadgeKey((k) => k + 1);
    };

    pushNext();
    const timer = window.setInterval(pushNext, POP_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [inView, reducedMotion, messages, times]);

  /** Static fallback: first + last of day (same beat as pre-animation layout). */
  const staticBubbles: VisibleBubble[] =
    messages.length === 0
      ? []
      : [
          { id: 1, text: messages[0] ?? "", time: times[0] ?? "" },
          {
            id: 2,
            text: messages[Math.min(3, messages.length - 1)] ?? "",
            time: times[Math.min(3, times.length - 1)] ?? "",
          },
        ];

  const stack = reducedMotion || !inView ? staticBubbles : visible;
  const showGhosts = reducedMotion || !inView;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-pain-storm
      className={`relative w-full max-w-[420px] justify-self-center lg:max-w-none lg:justify-self-end ${className}`}
    >
      {/*
        Mobile: 4:5 ≈ source → full frame (clippers+customer left visible).
        Desktop 5:6: object-cover + top → crop top/bottom only, keep full width.
      */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-zinc-900 lg:aspect-[5/6]">
        {slot.src ? (
          <Image
            src={slot.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 420px, 90vw"
            className="object-cover object-[left_top] lg:object-[center_top]"
            priority
          />
        ) : (
          <MarketingPhotoSlot
            slot="painBarber"
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, 90vw"
            objectPosition="left top"
            className="h-full w-full rounded-none border-0"
          />
        )}

        {/* Mobile gradient (v2): 170px transparent → 75% at 45% → #09090b */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[170px] lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(9,9,11,0.75) 45%, #09090b 100%)",
          }}
          aria-hidden
        />
        {/* Desktop: bottom fade — notifications sit on apron only */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[38%] bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent lg:block"
          aria-hidden
        />

        <span
          key={badgeKey}
          className={`absolute right-3 top-3 z-20 flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2.5 text-sm font-bold leading-none text-white shadow-[0_0_0_3px_rgba(9,9,11,0.55)] sm:right-4 sm:top-4 sm:h-9 sm:min-w-9 sm:text-base ${
            !reducedMotion && inView && badgeKey > 0 ? "pain-badge-shake" : ""
          }`}
        >
          {unreadLabel}
        </span>

        {/*
          Shared storm stack — mobile left, desktop right.
          Max 3 visible; newest at bottom with springy enter.
        */}
        <div
          className="absolute bottom-4 left-3 z-10 flex w-[min(100%-1.5rem,20.5rem)] flex-col gap-2 lg:left-auto lg:right-5"
          aria-hidden
        >
          {showGhosts && stack.length >= 2 ? (
            <>
              <LineBubble
                text={stack[0]?.text ?? ""}
                time={stack[0]?.time ?? ""}
                opacity={0.85}
              />
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-x-4 top-3 h-12 rounded-2xl border border-zinc-700 bg-zinc-800 opacity-35 lg:hidden"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-2 top-1.5 h-12 rounded-2xl border border-zinc-700 bg-zinc-800 opacity-60 lg:hidden"
                  aria-hidden
                />
                <LineBubble
                  text={stack[1]?.text ?? ""}
                  time={stack[1]?.time ?? ""}
                  opacity={1}
                />
              </div>
            </>
          ) : (
            stack.map((bubble, index) => (
              <LineBubble
                key={bubble.id}
                text={bubble.text}
                time={bubble.time}
                opacity={bubbleOpacity(index, stack.length)}
                className={!reducedMotion && inView ? "pain-notif-enter" : ""}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
