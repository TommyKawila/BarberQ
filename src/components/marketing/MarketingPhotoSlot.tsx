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

function aspectClass(meta: MarketingPhotoSlot): string {
  const ratio = meta.width / meta.height;
  if (Math.abs(ratio - 16 / 9) < 0.02) return "aspect-video";
  if (Math.abs(ratio - 4 / 3) < 0.02) return "aspect-[4/3]";
  if (Math.abs(ratio - 1) < 0.02) return "aspect-square";
  if (Math.abs(ratio - 3 / 4) < 0.02) return "aspect-[3/4]";
  return "aspect-[4/5]";
}

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
  const aspect = aspectClass(meta);
  const sizeLabel = `${meta.ratio} · ${meta.width}×${meta.height}`;
  // Circle slots usually pass fixed h/w via className — skip aspect + w-full stretch.
  const sizeClasses = fill
    ? "h-full w-full"
    : shape === "circle"
      ? "overflow-hidden p-1.5"
      : `${aspect} w-full px-3`;

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-0.5 border border-zinc-600/80 bg-zinc-800 text-center ${rounded} ${sizeClasses} ${className}`}
      role="img"
      aria-label={alt || meta.labelTh}
      data-photo-slot={meta.id}
      data-swap-path={meta.swapPath}
      title={`${meta.labelTh} → ${meta.swapPath}`}
    >
      <span
        className={`font-semibold leading-snug text-zinc-200 ${
          shape === "circle"
            ? "line-clamp-3 text-[8px] leading-tight"
            : "max-w-[16rem] text-[13px] sm:text-sm"
        }`}
      >
        {meta.labelTh}
      </span>
      {shape === "circle" ? null : (
        <>
          <span className="text-[11px] tabular-nums text-zinc-400">{sizeLabel}</span>
          <span className="max-w-[16rem] break-all font-mono text-[10px] leading-snug text-zinc-500">
            {meta.swapPath}
          </span>
        </>
      )}
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

  const imageClass = fill
    ? `object-cover ${rounded}`
    : `h-full w-full object-cover ${rounded}`;
  const imageStyle = { objectPosition };
  const fallback = meta.fallbackSrc ?? null;

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        {fallback ? (
          <picture>
            <source srcSet={meta.src} type="image/webp" />
            <Image
              src={fallback}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes}
              className={imageClass}
              style={imageStyle}
            />
          </picture>
        ) : (
          <Image
            src={meta.src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className={imageClass}
            style={imageStyle}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {fallback ? (
        <picture>
          <source srcSet={meta.src} type="image/webp" />
          <Image
            src={fallback}
            alt={alt}
            width={meta.width}
            height={meta.height}
            priority={priority}
            sizes={sizes}
            className={imageClass}
            style={imageStyle}
          />
        </picture>
      ) : (
        <Image
          src={meta.src}
          alt={alt}
          width={meta.width}
          height={meta.height}
          priority={priority}
          sizes={sizes}
          className={imageClass}
          style={imageStyle}
        />
      )}
    </div>
  );
}

/**
 * Single slot or responsive pair (desktop `lg+` / mobile below `lg`).
 * Set `src` in photo-slots.ts when Tommy drops the WebP at `swapPath`.
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
