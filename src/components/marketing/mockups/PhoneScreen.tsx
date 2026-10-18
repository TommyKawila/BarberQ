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
  priority?: boolean;
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
  priority,
}: Props) {
  return (
    <PhoneFrame
      size={size}
      width={width}
      fluid={fluid}
      matchHeight={matchHeight}
      className={className ?? (fluid ? PHONE_MOBILE : PHONE)}
    >
      <Image
        src={marketingScreens[screen]}
        alt={alt}
        width={390}
        height={844}
        sizes="(max-width: 768px) 64vw, 280px"
        priority={priority}
        className="h-full w-full object-cover object-top"
      />
    </PhoneFrame>
  );
}
