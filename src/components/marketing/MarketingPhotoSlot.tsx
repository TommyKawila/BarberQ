"use client";

import Image from "next/image";
import {
  marketingPhotoPairs,
  marketingPhotoSlots,
  type MarketingPhotoPairId,
  type MarketingPhotoSlot,
  type MarketingPhotoSlotId,
} from "@/lib/marketing/photo-slots";

type SharedProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  shape?: "rect" | "circle";
  /** Fill parent (object-cover); requires a sized parent. */
  fill?: boolean;
  objectPosition?: string;
};

type SingleProps = SharedProps & {
  slot: MarketingPhotoSlotId;
  pair?: never;
};

type PairProps = SharedProps & {
  pair: MarketingPhotoPairId;
  slot?: never;
  /** Override sizes for desktop / mobile frames. */
  desktopSizes?: string;
  mobileSizes?: string;
  desktopClassName?: string;
  mobileClassName?: string;
};

type Props = SingleProps | PairProps;

function Placeholder({
  meta,
  alt,
  className,
  shape,
  fill,
}: {
  meta: MarketingPhotoSlot;
  alt: string;
  className: string;
  shape: "rect" | "circle";
  fill?: boolean;
}) {
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const ratio = meta.width / meta.height;
  const aspect =
    Math.abs(ratio - 16 / 9) < 0.02
      ? "aspect-video"
      : Math.abs(ratio - 4 / 3) < 0.02
        ? "aspect-[4/3]"
        : Math.abs(ratio - 1) < 0.02
          ? "aspect-square"
          : "aspect-[4/5]";

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-500/40 bg-zinc-900/80 px-4 text-center ${rounded} ${
        fill ? "h-full w-full" : `${aspect} w-full`
      } ${className}`}
      role="img"
      aria-label={alt}
      data-photo-slot={meta.id}
      data-swap-path={meta.swapPath}
    >
      <span className="rounded-md border border-amber-500/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
        Placeholder
      </span>
      <span className="text-xs font-medium text-zinc-300">{meta.label}</span>
      <span className="max-w-[18rem] text-[11px] leading-snug text-zinc-500">
        {meta.artNote}
      </span>
      <span className="text-[11px] text-zinc-600">{meta.swapPath}</span>
    </div>
  );
}

function SlotFrame({
  meta,
  alt,
  className = "",
  priority,
  sizes = "100vw",
  shape = "rect",
  fill,
  objectPosition = "center",
}: SharedProps & { meta: MarketingPhotoSlot }) {
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  if (!meta.src) {
    return (
      <Placeholder
        meta={meta}
        alt={alt}
        className={className}
        shape={shape}
        fill={fill}
      />
    );
  }

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        <Image
          src={meta.src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${rounded}`}
          style={{ objectPosition }}
        />
      </div>
    );
  }

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
        style={{ objectPosition }}
      />
    </div>
  );
}

/**
 * Single slot or responsive pair (desktop `lg+` / mobile below `lg`).
 * Set `src` in photo-slots.ts when the WebP is ready.
 */
export function MarketingPhotoSlot(props: Props) {
  if (props.pair) {
    const {
      pair,
      alt,
      priority,
      shape = "rect",
      fill,
      objectPosition,
      desktopSizes = "(min-width: 1024px) 100vw, 100vw",
      mobileSizes = "100vw",
      desktopClassName = "",
      mobileClassName = "",
      className = "",
    } = props;
    const ids = marketingPhotoPairs[pair];
    const desktop = marketingPhotoSlots[ids.desktop];
    const mobile = marketingPhotoSlots[ids.mobile];

    return (
      <>
        <div className={`hidden lg:block ${className} ${desktopClassName}`}>
          <SlotFrame
            meta={desktop}
            alt={alt}
            priority={priority}
            sizes={desktopSizes}
            shape={shape}
            fill={fill}
            objectPosition={objectPosition ?? (pair === "hero" ? "right center" : "center")}
            className={fill ? "h-full w-full rounded-none border-0" : ""}
          />
        </div>
        <div className={`lg:hidden ${className} ${mobileClassName}`}>
          <SlotFrame
            meta={mobile}
            alt={alt}
            priority={priority}
            sizes={mobileSizes}
            shape={shape}
            fill={fill}
            objectPosition={objectPosition ?? "center"}
          />
        </div>
      </>
    );
  }

  const meta = marketingPhotoSlots[props.slot];
  return (
    <SlotFrame
      meta={meta}
      alt={props.alt}
      className={props.className}
      priority={props.priority}
      sizes={props.sizes}
      shape={props.shape}
      fill={props.fill}
      objectPosition={props.objectPosition}
    />
  );
}
