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
 * Dynamic Island stays on top (baked in via chroma-key composite script).
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
    width: 720,
    height: 900,
  };
  const mobile = {
    src: handPhoneHero.mobile,
    width: 420,
    height: 525,
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
          sizes="(max-width: 768px) 90vw, 480px"
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
          sizes="90vw"
          className="h-auto w-full object-contain"
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

  // auto: art-direction with mobile + desktop pre-renders
  return (
    <div className={`relative mx-auto w-full max-w-full min-w-0 ${className ?? ""}`}>
      <Image
        src={mobile.src}
        alt={alt}
        width={mobile.width}
        height={mobile.height}
        priority={priority}
        sizes="(max-width: 768px) 90vw, 420px"
        className="h-auto w-full object-contain md:hidden"
      />
      <Image
        src={desktop.src}
        alt={alt}
        width={desktop.width}
        height={desktop.height}
        priority={priority}
        sizes="(min-width: 768px) 480px, 90vw"
        className="hidden h-auto w-full object-contain md:block"
      />
    </div>
  );
}
