"use client";

import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";

export function AppHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Brand guide: small mark ≤48px, cream on dark, no frame — 32px */}
        <BrandMark size={32} framed={false} />
        <ShopNameLockup platformVariant={isAdmin ? "header" : "mini"} />
      </div>
      <LanguageToggle />
    </header>
  );
}
