"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopBrand } from "@/lib/brand/shop-brand";

interface ShopNameLockupProps {
  shopName?: string | null;
  className?: string;
}

export function ShopNameLockup({ shopName: shopNameProp, className }: ShopNameLockupProps) {
  const { t } = useI18n();
  const { shopName: shopNameFromContext } = useShopBrand();
  const shopName = shopNameProp !== undefined ? shopNameProp : shopNameFromContext;

  if (!shopName) {
    return (
      <span className={`text-sm font-bold tracking-[0.2em] text-amber-400 ${className ?? ""}`}>
        {t("common.brand")}
      </span>
    );
  }

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="truncate text-sm font-bold leading-tight text-zinc-50">{shopName}</p>
      <p className="text-[10px] font-medium tracking-wide text-zinc-500">{t("common.byBrand")}</p>
    </div>
  );
}
