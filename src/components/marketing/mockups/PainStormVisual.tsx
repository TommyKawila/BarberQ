"use client";

import Image from "next/image";
import { MarketingPhotoSlot } from "@/components/marketing/MarketingPhotoSlot";
import { marketingPhotoSlots } from "@/lib/marketing/photo-slots";

/** Option C — photo with 99+ badge + LINE notification storm over the lower half. */
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
  /** Older notifications fade: 09:14 → 17:48 */
  const opacities = [0.6, 0.75, 0.9, 1] as const;

  return (
    <div
      aria-hidden="true"
      className={`relative w-full max-w-[420px] justify-self-center lg:max-w-none lg:justify-self-end ${className}`}
    >
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[28px] bg-zinc-900">
        {slot.src ? (
          <Image
            src={slot.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 420px, 90vw"
            className="object-cover object-[68%_22%]"
            priority={false}
          />
        ) : (
          <MarketingPhotoSlot
            slot="painBarber"
            alt={alt}
            fill
            sizes="(min-width: 1280px) 44vw, 90vw"
            className="h-full w-full rounded-none border-0"
          />
        )}

        {/* 260px bottom fade — notifications sit on apron, not face/phone */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent sm:h-[220px] lg:h-[260px]"
          aria-hidden
        />

        <span className="absolute right-3 top-3 z-20 flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2.5 text-sm font-bold leading-none text-white shadow-[0_0_0_3px_rgba(9,9,11,0.55)] sm:right-4 sm:top-4 sm:h-9 sm:min-w-9 sm:text-base">
          {unreadLabel}
        </span>

        {/* Keep left inset ≥ logo size so LINE badges aren’t clipped by overflow-hidden */}
        <div className="absolute bottom-4 left-3 right-3 z-10 flex flex-col gap-2 sm:bottom-5 sm:left-4 sm:right-4 lg:left-5 lg:gap-2.5">
          {messages.map((text, i) => (
            <div
              key={i}
              className="flex max-w-[min(100%,22rem)] items-center gap-2.5 rounded-2xl border border-zinc-700/50 bg-zinc-900/85 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:max-w-[20.5rem] lg:gap-3 lg:px-3.5 lg:py-3"
              style={{ opacity: opacities[i] ?? 1 }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold tracking-tight text-white"
                style={{ backgroundColor: "#06C755" }}
              >
                LINE
              </span>
              <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-100 lg:text-[17px]">
                {text}
              </p>
              <span className="shrink-0 text-[12px] tabular-nums text-zinc-400 lg:text-[13px]">
                {times[i] ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
