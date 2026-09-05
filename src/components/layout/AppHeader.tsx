"use client";

import { BrandMark } from "@/components/layout/BrandMark";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={36} />
        <ShopNameLockup />
      </div>
      <LanguageToggle />
    </header>
  );
}
