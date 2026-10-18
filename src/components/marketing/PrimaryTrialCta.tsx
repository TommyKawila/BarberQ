"use client";

import { Check } from "lucide-react";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";
import type { MarketingEventName } from "@/lib/marketing/events";

/** High-contrast amber CTA — shared by hero, pricing, final, sticky. Soft shadow so risk copy stays legible. */
export const PRIMARY_TRIAL_CTA_CLASS =
  "cta-pulse inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-3 text-base font-bold text-zinc-950 shadow-[0_4px_14px_rgba(251,191,36,0.28)] ring-1 ring-amber-300/70 hover:bg-amber-300 sm:min-h-12 md:min-h-14 md:text-lg";

const RISK_ITEMS = ["marketing.risk.noCard", "marketing.risk.cancelAnytime"] as const;

/** Visible risk-reversal under primary CTAs (verified claims only). */
export function RiskReversalRow({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <ul
      className={`mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium leading-snug text-zinc-100 sm:justify-start md:text-[15px] ${className}`}
    >
      {RISK_ITEMS.map((key) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <Check
            size={16}
            className="shrink-0 text-amber-400"
            strokeWidth={2.75}
            aria-hidden
          />
          <span>{t(key as MessageKey)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrimaryTrialCta({
  labelKey,
  placement,
  className = "",
  fullWidth,
  eventName = "sales_cta_click",
  showRisk = true,
  riskClassName,
}: {
  labelKey: MessageKey;
  placement: string;
  className?: string;
  fullWidth?: boolean;
  eventName?: Extract<MarketingEventName, "sales_cta_click" | "sticky_cta_click">;
  showRisk?: boolean;
  riskClassName?: string;
}) {
  const { t } = useI18n();
  const label = fillOfferCopy(t(labelKey));
  const inPage = placement !== "sticky";
  return (
    <div
      className={fullWidth ? "w-full" : undefined}
      {...(inPage ? { "data-inpage-trial-cta": "" } : {})}
    >
      <MarketingTrialLink
        placement={placement}
        eventName={eventName}
        className={`${PRIMARY_TRIAL_CTA_CLASS} ${fullWidth ? "w-full" : ""} ${className}`}
      >
        {label}
      </MarketingTrialLink>
      {showRisk ? <RiskReversalRow className={riskClassName} /> : null}
    </div>
  );
}
