"use client";

import { Check } from "lucide-react";
import { MarketingTrialLink } from "@/components/marketing/MarketingTrialLink";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { fillOfferCopy } from "@/lib/marketing/offer";
import type { MarketingEventName } from "@/lib/marketing/events";

/** High-contrast amber CTA — shared by hero, pricing, final, sticky. */
export const PRIMARY_TRIAL_CTA_CLASS =
  "cta-pulse inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 text-base font-bold text-zinc-950 shadow-[0_10px_28px_rgba(251,191,36,0.55)] ring-2 ring-amber-300/80 hover:bg-amber-300 md:min-h-[3.75rem] md:text-lg";

const RISK_ITEMS = ["marketing.risk.noCard", "marketing.risk.cancelAnytime"] as const;

/** Visible risk-reversal under primary CTAs (verified claims only). */
export function RiskReversalRow({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <ul
      className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium leading-snug text-zinc-100 md:text-[15px] ${className}`}
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
  return (
    <div className={fullWidth ? "w-full" : undefined}>
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
