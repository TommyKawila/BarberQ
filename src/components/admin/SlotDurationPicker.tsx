"use client";

import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";
import { useI18n } from "@/lib/i18n/locale-provider";

interface SlotDurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
  /** Optional id for aria-labelledby / tests */
  "data-testid"?: string;
}

/**
 * Theme-styled duration control (replaces native &lt;select&gt; on mobile).
 * Gold segmented chips for 15 / 30 / 45 / 60 / 90 / 120 minutes.
 */
export function SlotDurationPicker({
  value,
  onChange,
  "data-testid": testId = "slot-duration-picker",
}: SlotDurationPickerProps) {
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("admin.slotDuration")}
      data-testid={testId}
      className="mt-1 grid grid-cols-3 gap-2"
    >
      {ALLOWED_SLOT_DURATIONS.map((minutes) => {
        const selected = value === minutes;
        return (
          <button
            key={minutes}
            type="button"
            data-testid={`slot-duration-${minutes}`}
            aria-pressed={selected}
            onClick={() => onChange(minutes)}
            className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
              selected
                ? "bg-amber-400 text-zinc-950"
                : "border border-zinc-700 bg-zinc-900 text-zinc-200"
            }`}
          >
            {minutes}{" "}
            <span className="ml-0.5 text-xs font-medium opacity-80">
              {t("common.minutes")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
