import Image from "next/image";
import Link from "next/link";
import { BARBERQX_BRAND } from "@/lib/brand/barberqx";

interface BarberQxLogoProps {
  href?: string;
  priority?: boolean;
  className?: string;
}

export function BarberQxLogo({ href = "/", priority, className }: BarberQxLogoProps) {
  const img = (
    <Image
      src={BARBERQX_BRAND.assets.logoHorizontalDark}
      alt="BarberQx"
      width={140}
      height={32}
      priority={priority}
      className={className ?? "h-8 w-auto"}
    />
  );
  if (!href) return img;
  return <Link href={href}>{img}</Link>;
}
