"use client";

import Link from "next/link";
import { BarberQxLogo } from "@/components/brand/BarberQxLogo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useI18n } from "@/lib/i18n/locale-provider";
import { trackMarketingEvent } from "@/lib/marketing/events";

export function MarketingNav() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <BarberQxLogo priority />
        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <a href="#how-it-works" className="hover:text-amber-400">{t("marketing.nav.how")}</a>
          <a href="#features" className="hover:text-amber-400">{t("marketing.nav.features")}</a>
          <a href="#pricing" className="hover:text-amber-400">{t("marketing.nav.pricing")}</a>
          <a href="#faq" className="hover:text-amber-400">{t("marketing.nav.faq")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/trial"
            onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
            className="min-h-11 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 md:hidden"
          >
            {t("marketing.hero.ctaShort")}
          </Link>
          <Link
            href="/trial"
            onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
            className="hidden min-h-11 rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 md:inline-flex md:items-center"
          >
            {t("marketing.nav.trial")}
          </Link>
        </div>
      </div>
    </header>
  );
}
