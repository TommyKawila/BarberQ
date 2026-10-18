"use client";

import { clipperqIconSrc } from "@/lib/brand/barberqx";
import { useShopBrand } from "@/lib/brand/shop-brand";

interface BrandMarkProps {
  size?: number;
}

function DefaultMark({ size }: { size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-zinc-900"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={clipperqIconSrc("dark", Math.round(size * 0.72))}
        alt=""
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        className="object-contain"
        decoding="async"
      />
    </span>
  );
}

export function BrandMark({ size = 32 }: BrandMarkProps) {
  const { logoDataUrl } = useShopBrand();

  if (logoDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL from shop settings
      <img
        src={logoDataUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-lg object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return <DefaultMark size={size} />;
}
