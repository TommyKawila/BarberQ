"use client";

import Image from "next/image";
import {
  marketingPhotoSlots,
  type MarketingPhotoSlotId,
} from "@/lib/marketing/photo-slots";

type Props = {
  slot: MarketingPhotoSlotId;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** "circle" for founder avatar */
  shape?: "rect" | "circle";
};

/**
 * Easy swap: set marketingPhotoSlots[id].src in photo-slots.ts once the
 * real WebP is at swapPath. Placeholder stays clearly marked until then.
 */
export function MarketingPhotoSlot({
  slot,
  alt,
  className = "",
  priority,
  sizes = "100vw",
  shape = "rect",
}: Props) {
  const meta = marketingPhotoSlots[slot];
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  if (meta.src) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        <Image
          src={meta.src}
          alt={alt}
          width={meta.width}
          height={meta.height}
          priority={priority}
          sizes={sizes}
          className={`h-full w-full object-cover ${rounded}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-500/40 bg-zinc-900/80 px-4 text-center ${rounded} ${className}`}
      role="img"
      aria-label={alt}
      data-photo-slot={meta.id}
      data-swap-path={meta.swapPath}
    >
      <span className="rounded-md border border-amber-500/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
        Placeholder
      </span>
      <span className="text-xs font-medium text-zinc-300">{meta.label}</span>
      <span className="max-w-[16rem] text-[11px] leading-snug text-zinc-500">
        {meta.swapPath}
      </span>
    </div>
  );
}
