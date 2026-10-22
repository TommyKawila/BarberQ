"use client";

import { CircleCheck, MessageCircle, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";

const STEPS = [1, 2, 3] as const;
const ICONS = [MessageCircle, CircleCheck, Smartphone] as const;

/**
 * Compact how-it-works — titles + captions only (no phone mockups).
 */
export function HowItWorksStrip() {
  const { t } = useI18n();

  return (
    <div>
      <p className="text-center text-sm font-medium tracking-wide text-amber-300/80 md:text-left">
        {t("marketing.how.eyebrow")}
      </p>
      <h2 className="mt-2 text-center text-[1.75rem] font-bold leading-[1.3] text-zinc-50 md:text-left md:text-3xl">
        {t("marketing.how.title")}
      </h2>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((n) => {
          const Icon = ICONS[n - 1];
          return (
            <li
              key={n}
              className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-3.5 py-3.5 sm:flex-col sm:items-center sm:px-4 sm:py-5 sm:text-center"
            >
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums text-amber-400 sm:text-base">
                <Icon size={18} className="shrink-0" strokeWidth={2} aria-hidden />
                {String(n).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-snug text-zinc-50 sm:text-base">
                  {t(`marketing.how.${n}.title` as MessageKey)}
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-zinc-400 sm:text-sm">
                  {t(`marketing.how.${n}.caption` as MessageKey)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
