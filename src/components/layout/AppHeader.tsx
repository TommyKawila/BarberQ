"use client";

import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";
import { useShopBrand } from "@/lib/brand/shop-brand";

export function AppHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");
  const { shopName } = useShopBrand();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Brand guide: small mark ≤48px, cream on dark, no frame */}
        <BrandMark size={32} framed={false} />
        {isAdmin ? (
          // Admin v3: one logo + shop name only (no second platform "Q ClipperQ" line)
          <p className="truncate font-heading text-sm font-semibold text-zinc-50">
            {shopName?.trim() || "ClipperQ"}
          </p>
        ) : (
          <ShopNameLockup platformVariant="mini" />
        )}
      </div>
      <LanguageToggle />
    </header>
  );
}
