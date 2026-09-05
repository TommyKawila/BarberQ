"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/dictionary";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "EN" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex min-h-9 rounded-lg bg-zinc-800 p-0.5">
      {OPTIONS.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            className={`min-h-8 min-w-[2.75rem] rounded-md px-2 text-xs font-semibold transition ${
              active
                ? "bg-amber-400 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
