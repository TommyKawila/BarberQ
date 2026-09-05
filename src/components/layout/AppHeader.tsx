"use client";

import { BrandMark } from "@/components/layout/BrandMark";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useI18n } from "@/lib/i18n/locale-provider";

export function AppHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <BrandMark size={36} />
        <span className="text-sm font-bold tracking-[0.2em] text-amber-400">
          {t("common.brand")}
        </span>
      </div>
      <LanguageToggle />
    </header>
  );
}
