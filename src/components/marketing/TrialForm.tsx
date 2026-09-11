"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Check, CheckCircle } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { getMarketingAttribution, readStashedAttribution } from "@/lib/marketing/attribution";
import { trackMarketingEvent } from "@/lib/marketing/events";
import {
  firstInvalidTrialField,
  getTrialFormFieldErrors,
  type TrialFormField,
} from "@/lib/marketing/trial-form-ux";

const TRUST = [1, 2, 3, 4] as const;
const ERROR_KEY: Record<TrialFormField, MessageKey> = {
  shopName: "marketing.trial.err.shopName",
  contactName: "marketing.trial.err.contactName",
  contactValue: "marketing.trial.err.contactValue",
  barberCount: "marketing.trial.err.barberCount",
};

function getSupportLineUrl(): string | undefined {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL) {
    return process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
  }
  return undefined;
}

function fieldClass(invalid: boolean): string {
  return `mt-1 min-h-12 w-full scroll-mt-24 rounded-lg border bg-zinc-900 px-4 py-3 text-[15px] outline-none focus:border-amber-500 ${
    invalid ? "border-red-500" : "border-zinc-700"
  }`;
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TrialFormField, true>>>({});
  const startedRef = useRef(false);
  const shopNameRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactValueRef = useRef<HTMLInputElement>(null);
  const barberCountRef = useRef<HTMLInputElement>(null);
  const supportUrl = getSupportLineUrl();

  const fieldRefs: Record<TrialFormField, RefObject<HTMLInputElement | null>> = {
    shopName: shopNameRef,
    contactName: contactNameRef,
    contactValue: contactValueRef,
    barberCount: barberCountRef,
  };

  useEffect(() => {
    trackMarketingEvent("trial_page_view");
  }, []);

  function onFormFocus() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackMarketingEvent("trial_form_started");
    }
  }

  function clearFieldError(field: TrialFormField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const errors = getTrialFormFieldErrors({
      shopName,
      contactName,
      contactValue,
      barberCount,
    });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      const first = firstInvalidTrialField(errors);
      if (first) {
        const el = fieldRefs[first].current;
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    trackMarketingEvent("trial_form_submit");

    const attribution = getMarketingAttribution(
      window.location.search,
      readStashedAttribution(),
    );
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
      <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
        <MarketingNav variant="trial" />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-10 text-center md:px-8">
            <CheckCircle size={40} className="mx-auto text-amber-400" strokeWidth={1.75} />
            <h1 className="mt-4 text-2xl font-bold">{t("marketing.trial.successTitle")}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">
              {t("marketing.trial.successBody")}
            </p>
            {supportUrl ? (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMarketingEvent("support_line_click")}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-semibold text-zinc-950"
              >
                {t("marketing.trial.line")}
              </a>
            ) : null}
            <Link
              href="/"
              className="mt-4 inline-flex min-h-11 items-center justify-center text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-200"
            >
              {t("marketing.trial.backHome")}
            </Link>
          </div>
        </div>
        <MarketingFooter variant="trial" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <AttributionCapture />
      <MarketingNav variant="trial" />
      <div className="mx-auto grid w-full max-w-[1080px] flex-1 items-start gap-10 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-6 md:py-16">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{t("marketing.trial.title")}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-300 md:text-base">
            {t("marketing.trial.subtitle")}
          </p>
          <ul className="mt-6 space-y-2.5">
            {TRUST.map((n) => (
              <li
                key={n}
                className="flex items-center gap-2 text-[15px] text-zinc-300"
              >
                <Check size={16} className="shrink-0 text-amber-400" strokeWidth={2.5} />
                {t(`marketing.trial.trust${n}` as MessageKey)}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-zinc-400">
            {t("marketing.trial.afterSubmit")}
          </p>
        </div>

        <div className="w-full max-w-[480px] justify-self-stretch rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:justify-self-end md:p-7">
          <h2 className="text-lg font-semibold">{t("marketing.trial.formTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("marketing.trial.formTime")}</p>

          <form
            noValidate
            onSubmit={(e) => void onSubmit(e)}
            onFocus={onFormFocus}
            className="mt-6 space-y-4"
          >
            <label className="block">
              <span className="text-sm text-zinc-300">{t("marketing.trial.shopName")}</span>
              <input
                ref={shopNameRef}
                id="trial-shopName"
                value={shopName}
                autoComplete="organization"
                aria-invalid={fieldErrors.shopName ? true : undefined}
                aria-describedby={fieldErrors.shopName ? "trial-shopName-error" : undefined}
                onChange={(e) => {
                  setShopName(e.target.value);
                  clearFieldError("shopName");
                }}
                className={fieldClass(Boolean(fieldErrors.shopName))}
              />
              {fieldErrors.shopName ? (
                <p id="trial-shopName-error" className="mt-1 text-sm text-red-400">
                  {t(ERROR_KEY.shopName)}
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm text-zinc-300">{t("marketing.trial.contactName")}</span>
              <input
                ref={contactNameRef}
                id="trial-contactName"
                value={contactName}
                autoComplete="name"
                aria-invalid={fieldErrors.contactName ? true : undefined}
                aria-describedby={fieldErrors.contactName ? "trial-contactName-error" : undefined}
                onChange={(e) => {
                  setContactName(e.target.value);
                  clearFieldError("contactName");
                }}
                className={fieldClass(Boolean(fieldErrors.contactName))}
              />
              {fieldErrors.contactName ? (
                <p id="trial-contactName-error" className="mt-1 text-sm text-red-400">
                  {t(ERROR_KEY.contactName)}
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm text-zinc-300">{t("marketing.trial.contactValue")}</span>
              <input
                ref={contactValueRef}
                id="trial-contactValue"
                value={contactValue}
                autoComplete="tel"
                placeholder={t("marketing.trial.contactPlaceholder")}
                aria-invalid={fieldErrors.contactValue ? true : undefined}
                aria-describedby={fieldErrors.contactValue ? "trial-contactValue-error" : undefined}
                onChange={(e) => {
                  setContactValue(e.target.value);
                  clearFieldError("contactValue");
                }}
                className={fieldClass(Boolean(fieldErrors.contactValue))}
              />
              {fieldErrors.contactValue ? (
                <p id="trial-contactValue-error" className="mt-1 text-sm text-red-400">
                  {t(ERROR_KEY.contactValue)}
                </p>
              ) : null}
            </label>

            <fieldset className="space-y-4 border-t border-zinc-800 pt-4">
              <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("marketing.trial.optionalHeading")}
              </legend>
              <label className="block">
                <span className="text-sm text-zinc-500">{t("marketing.trial.barberCount")}</span>
                <input
                  ref={barberCountRef}
                  id="trial-barberCount"
                  type="number"
                  inputMode="numeric"
                  value={barberCount}
                  aria-invalid={fieldErrors.barberCount ? true : undefined}
                  aria-describedby={fieldErrors.barberCount ? "trial-barberCount-error" : undefined}
                  onChange={(e) => {
                    setBarberCount(e.target.value);
                    clearFieldError("barberCount");
                  }}
                  className={fieldClass(Boolean(fieldErrors.barberCount))}
                />
                {fieldErrors.barberCount ? (
                  <p id="trial-barberCount-error" className="mt-1 text-sm text-red-400">
                    {t(ERROR_KEY.barberCount)}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm text-zinc-500">{t("marketing.trial.province")}</span>
                <input
                  value={province}
                  autoComplete="address-level1"
                  onChange={(e) => setProvince(e.target.value)}
                  className={fieldClass(false)}
                />
              </label>
            </fieldset>

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
              className="min-h-12 w-full rounded-xl bg-amber-400 px-4 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {submitting ? (
                t("marketing.trial.submitting")
              ) : (
                <>
                  <span className="md:hidden">{t("marketing.trial.submitShort")}</span>
                  <span className="hidden md:inline">{t("marketing.trial.submit")}</span>
                </>
              )}
            </button>
            <p className="text-center text-[13px] text-zinc-500">{t("marketing.trial.ctaTrust")}</p>
          </form>
        </div>
      </div>
      <MarketingFooter variant="trial" />
    </div>
  );
}
