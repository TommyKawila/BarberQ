"use client";

import {
  CUSTOMER_REMINDER_CHIP_OPTIONS,
  isCustomerReminderLeadFuture,
} from "@/lib/reminders/customer-chips";
import { reminderLeadMessageKey, type ReminderLeadOption } from "@/lib/reminders/labels";
import type { MessageKey } from "@/lib/i18n/dictionary";

export function ReminderLeadChips({
  startTimeIso,
  value,
  onChange,
  label,
  hint,
  t,
  now = new Date(),
}: {
  startTimeIso: string;
  value: ReminderLeadOption;
  onChange: (next: ReminderLeadOption) => void;
  label: string;
  hint: string;
  t: (key: MessageKey) => string;
  now?: Date;
}) {
  const start = new Date(startTimeIso);

  return (
    <div className="flex flex-col gap-2" data-testid="reminder-lead-chips">
      <p className="text-sm font-medium text-zinc-100">{label}</p>
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={label}
      >
        {CUSTOMER_REMINDER_CHIP_OPTIONS.map((mins) => {
          const future = isCustomerReminderLeadFuture(mins, start, now);
          const selected = value === mins;
          return (
            <button
              key={mins}
              type="button"
              disabled={!future}
              aria-pressed={selected}
              data-testid={`reminder-chip-${mins}`}
              onClick={() => onChange(mins)}
              className={[
                "min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold transition",
                selected
                  ? "bg-amber-400 text-zinc-950"
                  : future
                    ? "border border-zinc-600 bg-zinc-900 text-zinc-100"
                    : "cursor-not-allowed border border-zinc-800 bg-zinc-950 text-zinc-600 opacity-50",
              ].join(" ")}
            >
              {t(reminderLeadMessageKey(mins) as MessageKey)}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-snug text-zinc-500">{hint}</p>
    </div>
  );
}
