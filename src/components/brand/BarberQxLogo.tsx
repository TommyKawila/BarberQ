import Link from "next/link";
import {
  BARBERQX_BRAND,
  clipperqIconSrc,
  clipperqLockupSrc,
  clipperqWordmarkSrc,
} from "@/lib/brand/barberqx";

type LogoVariant = "lockup" | "wordmark" | "icon";
/** Background behind the logo (not ink color). */
type LogoSurface = "dark" | "light";

interface BarberQxLogoProps {
  href?: string | null;
  priority?: boolean;
  className?: string;
  /** lockup (default) | wordmark | icon */
  variant?: LogoVariant;
  /** dark = cream artwork (default); light = dark ink artwork */
  surface?: LogoSurface;
}

function srcFor(variant: LogoVariant, surface: LogoSurface) {
  if (variant === "icon") return clipperqIconSrc(surface);
  if (variant === "wordmark") return clipperqWordmarkSrc(surface);
  return clipperqLockupSrc(surface);
}

function sizeFor(variant: LogoVariant) {
  if (variant === "icon") return { width: 32, height: 32 };
  if (variant === "wordmark") return { width: 140, height: 36 };
  return { width: 160, height: 40 };
}

/** ClipperQ logo. Name kept as BarberQxLogo for a smaller diff. */
export function BarberQxLogo({
  href = "/",
  priority,
  className,
  variant = "lockup",
  surface = "dark",
}: BarberQxLogoProps) {
  const { width, height } = sizeFor(variant);
  const img = (
    // SVG lockups — plain <img> avoids next/image SVG restrictions
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcFor(variant, surface)}
      alt={BARBERQX_BRAND.name}
      width={width}
      height={height}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={className ?? "h-8 w-auto"}
      decoding="async"
    />
  );
  if (!href) return img;
  return <Link href={href}>{img}</Link>;
}

export const ClipperQLogo = BarberQxLogo;
