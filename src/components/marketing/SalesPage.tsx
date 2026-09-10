"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { AdminMockup } from "@/components/marketing/mockups/AdminMockup";
import { BookingMockup } from "@/components/marketing/mockups/BookingMockup";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";
import { useI18n } from "@/lib/i18n/locale-provider";
import { marketingOffer } from "@/lib/marketing/offer";
import { trackMarketingEvent } from "@/lib/marketing/events";

function Section({
  id,
  title,
  children,
  className,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 md:py-20 ${className ?? ""}`}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <h2 className="text-2xl font-bold text-zinc-50 md:text-3xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function SalesPage() {
  const { t } = useI18n();

  useEffect(() => {
    trackMarketingEvent("sales_page_view");
  }, []);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <LiffCallbackRedirect />
      <AttributionCapture />
      <MarketingNav />

      <section className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950 py-20 md:py-28">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-4 md:flex-row md:px-6">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">{t("marketing.hero.title")}</h1>
            <p className="mt-4 text-lg text-zinc-400">{t("marketing.hero.subtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/trial"
                onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
                className="min-h-12 rounded-xl bg-amber-400 px-6 py-3 text-center font-semibold text-zinc-950"
              >
                <span className="md:hidden">{t("marketing.hero.ctaShort")}</span>
                <span className="hidden md:inline">{t("marketing.hero.cta")}</span>
              </Link>
              <a
                href="#how-it-works"
                onClick={() => trackMarketingEvent("how_it_works_click")}
                className="min-h-12 rounded-xl border border-zinc-600 px-6 py-3 text-center font-medium text-zinc-200"
              >
                {t("marketing.hero.secondary")}
              </a>
            </div>
          </div>
          <BookingMockup />
        </div>
      </section>

      <Section title={t("marketing.pain.title")} className="bg-zinc-900/30">
        <ul className="space-y-4 text-zinc-300">
          <li className="flex gap-3"><span className="text-amber-400">•</span>{t("marketing.pain.1")}</li>
          <li className="flex gap-3"><span className="text-amber-400">•</span>{t("marketing.pain.2")}</li>
          <li className="flex gap-3"><span className="text-amber-400">•</span>{t("marketing.pain.3")}</li>
        </ul>
      </Section>

      <Section title={t("marketing.beforeAfter.title")}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="font-semibold text-zinc-400">{t("marketing.beforeAfter.before")}</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>{t("marketing.beforeAfter.before1")}</li>
              <li>{t("marketing.beforeAfter.before2")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <h3 className="font-semibold text-amber-400">{t("marketing.beforeAfter.after")}</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>{t("marketing.beforeAfter.after1")}</li>
              <li>{t("marketing.beforeAfter.after2")}</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="how-it-works" title={t("marketing.how.title")}>
        <ol className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="rounded-2xl border border-zinc-800 p-6">
              <span className="text-2xl font-bold text-amber-400">0{n}</span>
              <p className="mt-3 text-zinc-300">{t(`marketing.how.${n}` as "marketing.how.1")}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t("marketing.customer.title")} className="bg-zinc-900/30">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <p className="flex-1 text-zinc-400">{t("marketing.customer.desc")}</p>
          <BookingMockup />
        </div>
      </Section>

      <Section title={t("marketing.owner.title")}>
        <div className="flex flex-col items-center gap-8 md:flex-row-reverse">
          <div className="flex-1">
            <p className="text-zinc-400">{t("marketing.owner.desc")}</p>
          </div>
          <AdminMockup />
        </div>
      </Section>

      <Section id="features" title={t("marketing.benefits.title")} className="bg-zinc-900/30">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span
              key={n}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300"
            >
              {t(`marketing.benefits.${n}` as "marketing.benefits.1")}
            </span>
          ))}
        </div>
      </Section>

      <Section title={t("marketing.barber.title")}>
        <p className="max-w-2xl text-zinc-400">{t("marketing.barber.desc")}</p>
      </Section>

      <Section title={t("marketing.setup.title")} className="bg-zinc-900/30">
        <p className="mb-6 max-w-2xl text-zinc-400">{t("marketing.setup.desc")}</p>
        <Link
          href="/trial"
          onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
          className="inline-flex min-h-12 items-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950"
        >
          {t("marketing.setup.cta")}
        </Link>
      </Section>

      <Section id="pricing" title={t("marketing.pricing.title")}>
        <div className="max-w-md rounded-2xl border border-amber-500/40 bg-zinc-900/80 p-8">
          <p className="text-3xl font-bold text-amber-400">{t("marketing.pricing.price")}</p>
          <p className="mt-2 text-zinc-400">{t("marketing.pricing.trial")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("marketing.pricing.barbers")}</p>
          <p className="mt-4 text-xs text-zinc-600">
            {marketingOffer.monthlyPrice} / {marketingOffer.barberLimit} / {marketingOffer.trialDays}
          </p>
        </div>
      </Section>

      <Section id="faq" title={t("marketing.faq.title")} className="bg-zinc-900/30">
        <div className="max-w-2xl space-y-3">
          {[1, 2, 3].map((n) => (
            <details key={n} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <summary className="cursor-pointer font-medium text-zinc-200">
                {t(`marketing.faq.${n}.q` as "marketing.faq.1.q")}
              </summary>
              <p className="mt-3 text-sm text-zinc-400">
                {t(`marketing.faq.${n}.a` as "marketing.faq.1.a")}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <section className="border-t border-zinc-800 py-20">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <h2 className="text-2xl font-bold md:text-3xl">{t("marketing.final.title")}</h2>
          <Link
            href="/trial"
            onClick={() => trackMarketingEvent("sales_cta_click", { destination: "/trial" })}
            className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-amber-400 px-8 py-3 font-semibold text-zinc-950"
          >
            {t("marketing.final.cta")}
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
