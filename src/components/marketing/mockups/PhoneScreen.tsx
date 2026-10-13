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
  fluid?: boolean;
  className?: string;
  priority?: boolean;
};

export function PhoneScreen({
  screen,
  alt = "",
  size,
  fluid,
  className,
  priority,
}: Props) {
  return (
    <PhoneFrame
      size={size}
      fluid={fluid}
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
