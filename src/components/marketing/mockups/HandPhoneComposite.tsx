import Image from "next/image";
import { handPhoneHero } from "@/lib/marketing/screens";

type Props = {
  alt?: string;
  className?: string;
  priority?: boolean;
  /** Prefer mobile-sized WebP under md, desktop otherwise. */
  variant?: "auto" | "mobile" | "desktop" | "full";
};

/**
 * Primary hero visual: pre-composited hand + real booking screenshot.
 * Mobile uses a tight high-res crop (~1284w) for DPR3 readability.
 */
export function HandPhoneComposite({
  alt = "",
  className,
  priority,
  variant = "auto",
}: Props) {
  const full = {
    src: handPhoneHero.composited,
    width: handPhoneHero.width,
    height: handPhoneHero.height,
  };
  const desktop = {
    src: handPhoneHero.desktop,
    width: handPhoneHero.desktopWidth,
    height: handPhoneHero.desktopHeight,
  };
  const mobile = {
    src: handPhoneHero.mobile,
    width: handPhoneHero.mobileWidth,
    height: handPhoneHero.mobileHeight,
  };

  if (variant === "full") {
    return (
      <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
        <Image
          src={full.src}
          alt={alt}
          width={full.width}
          height={full.height}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 480px"
          className="h-auto w-full object-contain"
        />
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
        <Image
          src={mobile.src}
          alt={alt}
          width={mobile.width}
          height={mobile.height}
          priority={priority}
          sizes="100vw"
          className="h-auto w-full object-contain object-center"
        />
      </div>
    );
  }

  if (variant === "desktop") {
    return (
      <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
        <Image
          src={desktop.src}
          alt={alt}
          width={desktop.width}
          height={desktop.height}
          priority={priority}
          sizes="480px"
          className="h-auto w-full object-contain"
        />
      </div>
    );
  }

  // auto: art-direction — full-bleed mobile crop + desktop pre-render
  return (
    <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
      <Image
        src={mobile.src}
        alt={alt}
        width={mobile.width}
        height={mobile.height}
        priority={priority}
        sizes="100vw"
        className="h-auto w-full object-contain object-center md:hidden"
      />
      <Image
        src={desktop.src}
        alt={alt}
        width={desktop.width}
        height={desktop.height}
        priority={priority}
        sizes="(min-width: 768px) 480px, 100vw"
        className="hidden h-auto w-full object-contain md:block"
      />
    </div>
  );
}
