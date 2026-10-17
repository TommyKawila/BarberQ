"use client";

import { useEffect, useState } from "react";
import { BarberQxLogo } from "@/components/brand/BarberQxLogo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";

export function MarketingNav({ variant = "sales" }: { variant?: "sales" | "trial" }) {
  const { t } = useI18n();
  const td = (key: MessageKey) => fillOfferCopy(t(key));
  const isTrial = variant === "trial";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isTrial) return;
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isTrial]);

  const chrome = isTrial
    ? "border-zinc-800/80 bg-zinc-950/90 backdrop-blur"
    : scrolled
      ? "border-white/10 bg-zinc-950/80 backdrop-blur-md"
      : "border-white/10 bg-zinc-950/30 backdrop-blur-md";

  return (
    <header className={`sticky top-0 z-50 border-b ${chrome}`}>
      <div
        className={
          isTrial
            ? "mx-auto flex w-full min-w-0 max-w-[1280px] items-center justify-between gap-2 px-4 py-3 md:gap-4 md:px-6"
            : "mx-auto grid w-full min-w-0 max-w-[1280px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-6"
        }
      >
        <BarberQxLogo priority className="h-auto w-[84px] shrink-0 justify-self-start md:w-[120px]" />
        {isTrial ? null : (
          <nav className="hidden items-center justify-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#how-it-works" className="hover:text-amber-400">
              {t("marketing.nav.how")}
            </a>
            <a href="#board" className="hover:text-amber-400">
              {t("marketing.nav.features")}
            </a>
            <a href="#pricing" className="hover:text-amber-400">
              {t("marketing.nav.pricing")}
            </a>
            <a href="#faq" className="hover:text-amber-400">
              {t("marketing.nav.faq")}
            </a>
          </nav>
        )}
        <div className="flex min-w-0 items-center justify-end gap-1.5 justify-self-end sm:gap-2">
          <LanguageToggle />
          {isTrial ? null : (
            <>
              {/* Mobile: gold outline so the hero keeps a single solid gold CTA */}
              <MarketingTrialLink
                placement="nav"
                className="inline-flex min-h-11 max-w-full shrink items-center rounded-xl border border-amber-400/90 bg-transparent px-3 py-2 text-sm font-semibold text-zinc-50 sm:px-4 md:hidden"
              >
                {td("marketing.nav.trialShort")}
              </MarketingTrialLink>
              {/* Desktop: solid gold unchanged */}
              <MarketingTrialLink
                placement="nav"
                className="hidden min-h-11 items-center rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 md:inline-flex"
              >
                {td("marketing.nav.trial")}
              </MarketingTrialLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
