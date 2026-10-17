"use client";

import Image from "next/image";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";

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
      className={`flex h-12 w-[300px] max-w-[calc(100%-24px)] items-center gap-2.5 rounded-2xl border border-zinc-700/50 bg-zinc-900/88 pl-2 pr-3 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm ${className}`}
      style={{ opacity }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold tracking-tight text-white"
        style={{ backgroundColor: "#06C755" }}
      >
        LINE
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-100">{text}</p>
      <span className="shrink-0 text-[12px] tabular-nums text-zinc-400">{time}</span>
    </div>
  );
}

/** Option C — photo with 99+ badge + LINE notification storm (mobile v2 / desktop clear subjects). */
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
  /** Desktop: 2 bubbles (first + last of day) in the bottom band — clear of face / phone / clippers. */
  const desktopIdx = [0, 3] as const;
  const desktopOpacities = [0.8, 1] as const;

  return (
    <div
      aria-hidden="true"
      className={`relative w-full max-w-[420px] justify-self-center lg:max-w-none lg:justify-self-end ${className}`}
    >
      {/* Mobile: 4:5 · Desktop layout C: 5:6 */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-zinc-900 lg:aspect-[5/6]">
        {slot.src ? (
          <Image
            src={slot.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 420px, 90vw"
            className="object-cover object-[50%_0%]"
            priority={false}
          />
        ) : (
          <MarketingPhotoSlot
            slot="painBarber"
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, 90vw"
            objectPosition="50% 0%"
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

        <span className="absolute right-3 top-3 z-20 flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2.5 text-sm font-bold leading-none text-white shadow-[0_0_0_3px_rgba(9,9,11,0.55)] sm:right-4 sm:top-4 sm:h-9 sm:min-w-9 sm:text-base">
          {unreadLabel}
        </span>

        {/*
          Mobile v2: 2 bubbles + peeking “more” cards.
          Bottom-anchored (bottom-4 + gap-2 + two h-12) → top ≈ 318 @390 (350×438).
        */}
        <div
          className="absolute bottom-4 left-3 z-10 flex flex-col gap-2 lg:hidden"
          aria-hidden
        >
          <LineBubble
            text={messages[0] ?? ""}
            time={times[0] ?? ""}
            opacity={0.85}
          />
          <div className="relative">
            {/* Ghost 2: inset 16px, +12px */}
            <div
              className="pointer-events-none absolute inset-x-4 top-3 h-12 rounded-2xl border border-zinc-700 bg-zinc-800 opacity-35"
              aria-hidden
            />
            {/* Ghost 1: inset 8px, +6px */}
            <div
              className="pointer-events-none absolute inset-x-2 top-1.5 h-12 rounded-2xl border border-zinc-700 bg-zinc-800 opacity-60"
              aria-hidden
            />
            <LineBubble text={messages[3] ?? ""} time={times[3] ?? ""} opacity={1} />
          </div>
        </div>

        {/* Desktop: 2 bubbles, lower-left bottom band on cape — clear of face, phone, clippers */}
        <div
          className="absolute bottom-4 left-5 z-10 hidden w-[min(100%-2.5rem,20.5rem)] flex-col gap-2 lg:flex"
          aria-hidden
        >
          {desktopIdx.map((msgIdx, i) => (
            <div
              key={msgIdx}
              className="flex items-center gap-2.5 rounded-2xl border border-zinc-700/50 bg-zinc-900/88 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm"
              style={{ opacity: desktopOpacities[i] ?? 1 }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold tracking-tight text-white"
                style={{ backgroundColor: "#06C755" }}
              >
                LINE
              </span>
              <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-100 lg:text-[16px]">
                {messages[msgIdx] ?? ""}
              </p>
              <span className="shrink-0 text-[12px] tabular-nums text-zinc-400 lg:text-[13px]">
                {times[msgIdx] ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
