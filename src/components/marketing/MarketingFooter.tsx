"use client";

import { BarberQxLogo } from "@/components/brand/BarberQxLogo";
import { useI18n } from "@/lib/i18n/locale-provider";
import { trackMarketingEvent } from "@/lib/marketing/events";

export function MarketingFooter({ variant = "sales" }: { variant?: "sales" | "trial" }) {
  const { t } = useI18n();
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  const copyright = t("marketing.footer.copyright").replace(
    "{year}",
    String(new Date().getFullYear()),
  );

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
    <footer
      data-hide-sticky
      className="border-t border-zinc-800 bg-zinc-950 py-10 md:py-12"
    >
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 px-4 text-center md:max-w-[560px] md:gap-5 md:px-6">
        <BarberQxLogo className="h-8 w-auto" />
        <p className="text-sm leading-snug text-zinc-500">{t("marketing.footer.tagline")}</p>
        <nav className="flex flex-wrap items-center justify-center gap-1">
          <a
            href="#how-it-works"
            className="inline-flex min-h-11 items-center px-3 text-sm text-zinc-400 hover:text-amber-400"
          >
            {t("marketing.nav.how")}
          </a>
          <a
            href="#pricing"
            className="inline-flex min-h-11 items-center px-3 text-sm text-zinc-400 hover:text-amber-400"
          >
            {t("marketing.nav.pricing")}
          </a>
          <a
            href="#faq"
            className="inline-flex min-h-11 items-center px-3 text-sm text-zinc-400 hover:text-amber-400"
          >
            {t("marketing.nav.faq")}
          </a>
        </nav>
        {supportUrl ? (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackMarketingEvent("support_line_click", { cta_location: "footer" })
            }
            className="inline-flex min-h-11 w-full max-w-[280px] items-center justify-center rounded-xl border border-amber-500/40 px-5 text-sm font-semibold text-amber-300 hover:bg-amber-500/10"
          >
            {t("marketing.footer.contact")}
          </a>
        ) : null}
        <p className="text-xs text-zinc-600">{copyright}</p>
      </div>
    </footer>
  );
}
