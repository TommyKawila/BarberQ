"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { useI18n } from "@/lib/i18n/locale-provider";
import { readStashedAttribution } from "@/lib/marketing/attribution";
import { trackMarketingEvent } from "@/lib/marketing/events";

function getSupportLineUrl(): string | undefined {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL) {
    return process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  }
  return undefined;
}

export function TrialForm() {
  const { t, locale } = useI18n();
  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [province, setProvince] = useState("");
  const [barberCount, setBarberCount] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const supportUrl = getSupportLineUrl();

  useEffect(() => {
    trackMarketingEvent("trial_page_view");
  }, []);

  function onFormFocus() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackMarketingEvent("trial_form_started");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    trackMarketingEvent("trial_form_submit");

    const attribution = readStashedAttribution();
    const body: Record<string, unknown> = {
      shopName,
      contactName,
      contactValue,
      province: province || undefined,
      barberCount: barberCount ? Number(barberCount) : undefined,
      website,
      locale: attribution.locale ?? locale,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      referrer: attribution.referrer,
    };

    try {
      const res = await fetch("/api/trial-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { id?: string; error?: { code?: string } };

      if (!res.ok) {
        const code =
          res.status === 429
            ? "RATE_LIMIT"
            : res.status === 400
              ? "VALIDATION"
              : "INTERNAL";
        trackMarketingEvent("trial_form_error", { errorCode: code });
        setError(t("marketing.trial.error"));
        return;
      }

      if (json.id) {
        setSuccessId(json.id);
        trackMarketingEvent("trial_form_success");
      }
    } catch {
      trackMarketingEvent("trial_form_error", { errorCode: "INTERNAL" });
      setError(t("marketing.trial.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (successId) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-50">
        <MarketingNav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-xl font-semibold text-amber-400">{t("marketing.trial.success")}</p>
          {supportUrl ? (
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMarketingEvent("support_line_click")}
              className="mt-6 inline-flex min-h-12 items-center rounded-xl border border-amber-500/40 px-6 py-3 text-amber-400"
            >
              {t("marketing.trial.line")}
            </a>
          ) : null}
          <Link href="/" className="mt-8 block text-sm text-zinc-500 underline">
            ← Home
          </Link>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <AttributionCapture />
      <MarketingNav />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold">{t("marketing.trial.title")}</h1>
        <p className="mt-2 text-zinc-400">{t("marketing.trial.subtitle")}</p>

        <form onSubmit={(e) => void onSubmit(e)} onFocus={onFormFocus} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-400">{t("marketing.trial.shopName")}</span>
            <input
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">{t("marketing.trial.contactName")}</span>
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">{t("marketing.trial.contactValue")}</span>
            <input
              required
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">{t("marketing.trial.province")}</span>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">{t("marketing.trial.barberCount")}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={barberCount}
              onChange={(e) => setBarberCount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-amber-500"
            />
          </label>
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {submitting ? t("marketing.trial.submitting") : t("marketing.trial.submit")}
          </button>
        </form>
      </div>
      <MarketingFooter />
    </div>
  );
}
