"use client";

import { clipperqIconSrc } from "@/lib/brand/barberqx";
import { useShopBrand } from "@/lib/brand/shop-brand";

interface BrandMarkProps {
  size?: number;
  /** When false, no tile/frame (ClipperQ small mark on dark). Default true for legacy. */
  framed?: boolean;
}

function DefaultMark({ size, framed }: { size: number; framed: boolean }) {
  const icon = Math.round(framed ? size * 0.72 : size);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={clipperqIconSrc("dark", size)}
      alt=""
      width={icon}
      height={icon}
      className="object-contain"
      decoding="async"
    />
  );
  if (!framed) {
    return (
      <span className="inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden="true">
        {img}
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-zinc-900"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {img}
    </span>
  );
}

export function BrandMark({ size = 32, framed = true }: BrandMarkProps) {
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

  return <DefaultMark size={size} framed={framed} />;
}
