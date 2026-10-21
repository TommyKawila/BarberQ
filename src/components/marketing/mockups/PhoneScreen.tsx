import Image from "next/image";
import { PhoneFrame, type PhoneSize } from "./PhoneFrame";
import type { MarketingScreenKey } from "@/lib/marketing/screens";
import { marketingScreens } from "@/lib/marketing/screens";

const PHONE = "mx-auto";
const PHONE_MOBILE = "mx-auto w-full max-w-[min(64vw,268px)]";

type Props = {
  screen: MarketingScreenKey;
  alt?: string;
  size?: PhoneSize;
  width?: number;
  fluid?: boolean;
  /** Fill parent height; width follows phone aspect (desktop board row). */
  matchHeight?: boolean;
  className?: string;
  /** Extra classes on the screenshot image (e.g. crop/zoom). */
  imageClassName?: string;
  /**
   * Extra top inset inside the frame so app chrome clears the Dynamic Island.
   * Compact how-it-works only — desktop PhoneScreen callers omit this.
   */
  safeTop?: boolean;
  priority?: boolean;
  /** Clear “ตัวอย่าง” badge — sample demo data, never real customers. */
  sampleLabel?: boolean;
};

/**
 * Real app screenshot inside PhoneFrame.
 * Screens are pre-padded with an iOS status-bar safe area (~54pt) so shop
 * chrome clears the Dynamic Island.
 */
export function PhoneScreen({
  screen,
  alt = "",
  size,
  width,
  fluid,
  matchHeight,
  className,
  imageClassName,
  safeTop,
  priority,
  sampleLabel,
}: Props) {
  return (
    <div className={`relative ${matchHeight ? "h-full w-auto" : ""}`}>
      <PhoneFrame
        size={size}
        width={width}
        fluid={fluid}
        matchHeight={matchHeight}
        className={className ?? (fluid ? PHONE_MOBILE : PHONE)}
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {safeTop ? (
            <div className="h-[14%] shrink-0 bg-zinc-950" aria-hidden />
          ) : null}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <Image
              src={marketingScreens[screen]}
              alt={alt}
              width={390}
              height={844}
              sizes="(max-width: 768px) 64vw, 280px"
              priority={priority}
              className={`h-full w-full object-cover object-top ${imageClassName ?? ""}`}
            />
          </div>
        </div>
      </PhoneFrame>
      {sampleLabel ? (
        <span className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-md border border-amber-400/50 bg-zinc-950/90 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-200 shadow-sm">
          ตัวอย่าง
        </span>
      ) : null}
    </div>
  );
}
