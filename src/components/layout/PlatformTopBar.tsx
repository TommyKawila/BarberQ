"use client";

import { PlatformBrandHeader } from "@/components/layout/PlatformBrand";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

interface PlatformTopBarProps {
  showLanguageToggle?: boolean;
}

export function PlatformTopBar({ showLanguageToggle = false }: PlatformTopBarProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2.5 backdrop-blur">
      <PlatformBrandHeader />
      {showLanguageToggle ? <LanguageToggle /> : null}
    </header>
  );
}
