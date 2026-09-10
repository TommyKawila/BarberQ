"use client";

import { PlatformBrand, type PlatformBrandVariant } from "@/components/layout/PlatformBrand";
import { useShopBrand } from "@/lib/brand/shop-brand";

interface ShopNameLockupProps {
  shopName?: string | null;
  className?: string;
  platformVariant?: PlatformBrandVariant;
}

export function ShopNameLockup({
  shopName: shopNameProp,
  className,
  platformVariant = "mini",
}: ShopNameLockupProps) {
  const { shopName: shopNameFromContext } = useShopBrand();
  const shopName = shopNameProp !== undefined ? shopNameProp : shopNameFromContext;

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      {shopName ? (
        <p className="truncate text-sm font-bold leading-tight text-zinc-50">{shopName}</p>
      ) : null}
      <PlatformBrand variant={platformVariant} className={shopName ? "mt-0.5" : undefined} />
    </div>
  );
}
