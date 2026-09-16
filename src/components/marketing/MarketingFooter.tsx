"use client";

import { BarberQxLogo } from "@/components/brand/BarberQxLogo";
import { useI18n } from "@/lib/i18n/locale-provider";

const LINK =
  "inline-flex min-h-11 items-center text-sm text-zinc-300 md:text-zinc-400 transition-colors hover:text-amber-400 focus-visible:outline-none focus-visible:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export function MarketingFooter({ variant = "sales" }: { variant?: "sales" | "trial" }) {
  const { t } = useI18n();

  if (variant === "trial") {
    return (
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6">
        <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-3 px-4 md:px-6">
          <BarberQxLogo className="h-6 w-auto" />
          <p className="text-sm text-zinc-500">{t("marketing.footer.tagline")}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="overflow-x-clip border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-16">
          <div className="md:w-[58%]">
            <BarberQxLogo />
            <p className="mt-4 text-sm text-zinc-300">{t("marketing.footer.tagline")}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {t("marketing.footer.statement")}
            </p>
          </div>
          <nav
            aria-labelledby="footer-explore"
            className="flex flex-col items-start md:pt-1"
          >
            <p
              id="footer-explore"
              className="mb-1 text-xs text-zinc-500 md:text-zinc-600"
            >
              {t("marketing.footer.explore")}
            </p>
            <a href="#how-it-works" className={LINK}>
              {t("marketing.nav.how")}
            </a>
            <a href="#pricing" className={LINK}>
              {t("marketing.nav.pricing")}
            </a>
            <a href="#faq" className={LINK}>
              {t("marketing.nav.faq")}
            </a>
          </nav>
        </div>
        <div className="mt-10 border-t border-zinc-800 pt-6 md:mt-12">
          <p className="text-xs text-zinc-600">{t("marketing.footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
