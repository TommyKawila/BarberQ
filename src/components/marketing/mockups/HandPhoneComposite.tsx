"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PhoneScreen } from "./PhoneScreen";
import {
  handPhoneAsset,
  marketingScreens,
  type MarketingScreenKey,
} from "@/lib/marketing/screens";

type ScreenRect = {
  top: string;
  left: string;
  width: string;
  height: string;
  borderRadius: string;
};

type Props = {
  screen: MarketingScreenKey;
  alt?: string;
  className?: string;
  /** Override green-screen hole coords when the owner photo differs. */
  screenRect?: ScreenRect;
  handSrc?: string;
  priority?: boolean;
};

/**
 * Slots a real app screenshot into a hand-holding-phone photo (green screen).
 * Falls back to the shared PhoneFrame until public/marketing/hand-phone.webp exists.
 */
export function HandPhoneComposite({
  screen,
  alt = "",
  className,
  screenRect = handPhoneAsset.screen,
  handSrc = handPhoneAsset.src,
  priority,
}: Props) {
  const [hasHand, setHasHand] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(handSrc, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setHasHand(res.ok);
      })
      .catch(() => {
        if (!cancelled) setHasHand(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handSrc]);

  if (!hasHand) {
    return (
      <div className={className}>
        <PhoneScreen screen={screen} alt={alt} fluid priority={priority} />
      </div>
    );
  }

  return (
    <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3 / 4" }}>
        <Image
          src={handSrc}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 90vw, 420px"
          className="object-contain object-center"
        />
        <div
          className="absolute overflow-hidden"
          style={{
            top: screenRect.top,
            left: screenRect.left,
            width: screenRect.width,
            height: screenRect.height,
            borderRadius: screenRect.borderRadius,
          }}
        >
          <Image
            src={marketingScreens[screen]}
            alt={alt}
            fill
            sizes="200px"
            className="object-cover object-top"
            priority={priority}
          />
        </div>
      </div>
    </div>
  );
}
