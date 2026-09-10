"use client";

import { BarberQxLogo } from "@/components/brand/BarberQxLogo";
import { useI18n } from "@/lib/i18n/locale-provider";
import { trackMarketingEvent } from "@/lib/marketing/events";

export function MarketingFooter() {
  const { t, locale } = useI18n();
  const supportUrl = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 md:px-6">
        <BarberQxLogo href={undefined} />
        <nav className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <a href="#how-it-works" className="hover:text-amber-400">{t("marketing.nav.how")}</a>
          <a href="#pricing" className="hover:text-amber-400">{t("marketing.nav.pricing")}</a>
          <a href="#faq" className="hover:text-amber-400">{t("marketing.nav.faq")}</a>
          {supportUrl ? (
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMarketingEvent("support_line_click")}
              className="hover:text-amber-400"
            >
              {t("marketing.footer.contact")}
            </a>
          ) : null}
        </nav>
        <p className="text-sm text-zinc-500">{t("marketing.footer.tagline")}</p>
        {locale === "en" ? (
          <p className="text-xs text-zinc-600">Booking for Barbers</p>
        ) : null}
      </div>
    </footer>
  );
}
