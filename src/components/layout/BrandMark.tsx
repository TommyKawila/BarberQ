"use client";

import { useShopBrand } from "@/lib/brand/shop-brand";

interface BrandMarkProps {
  size?: number;
}

function DefaultSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 text-amber-400"
    >
      <rect width="32" height="32" rx="8" className="fill-zinc-900" />
      <path
        d="M8 12h16v2H8v-2zm2 4h12v1.5H10V16zm-2 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v1H8v-1z"
        className="fill-current"
        opacity="0.9"
      />
      <circle cx="22" cy="10" r="5" className="fill-current" />
      <text
        x="22"
        y="12.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        className="fill-zinc-950"
      >
        Q
      </text>
    </svg>
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

  return <DefaultSvg size={size} />;
}
