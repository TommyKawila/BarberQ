"use client";

import { format, parseISO } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { isCustomerDateDisabled } from "@/lib/booking/customer-flow";
import { useI18n } from "@/lib/i18n/locale-provider";
import { getBangkokWeekday } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { Barber } from "@/types/booking";

interface DateSelectorProps {
  dates: string[];
  value: string | null;
  barber: Barber | null;
  hours: ShopHours;
  onChange: (dateISO: string) => void;
}

const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Show a native date picker when the strip is longer than a week. */
const PICKER_THRESHOLD = 7;

export function DateSelector({ dates, value, barber, hours, onChange }: DateSelectorProps) {
  const { locale, t } = useI18n();
  const weekdays = locale === "th" ? WEEKDAY_TH : WEEKDAY_EN;
  const dateLocale = locale === "th" ? th : enUS;
  const firstDate = dates[0] ?? null;
  const lastDate = dates[dates.length - 1] ?? null;
  const offDays = barber?.off_days ?? [];
  const showPicker = dates.length > PICKER_THRESHOLD && firstDate && lastDate;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {dates.map((dateISO) => {
          const weekday = getBangkokWeekday(dateISO);
          const disabled = isCustomerDateDisabled(dateISO, hours, offDays);
          const selected = dateISO === value && !disabled;
          const day = parseISO(`${dateISO}T00:00:00`);
          const isToday = dateISO === firstDate;
          return (
            <button
              key={dateISO}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateISO)}
              className={`flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-xl px-2 transition ${
                disabled
                  ? "cursor-not-allowed bg-zinc-900 text-zinc-500"
                  : selected
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              }`}
            >
              <span className="text-xs font-medium">
                {isToday ? t("booking.today") : weekdays[weekday]}
              </span>
              <span className="text-lg font-semibold leading-none">{format(day, "d")}</span>
              <span className="text-xs">{format(day, "MMM", { locale: dateLocale })}</span>
            </button>
          );
        })}
      </div>
      {showPicker ? (
        <label className="flex min-h-11 items-center gap-3 rounded-xl bg-zinc-900 px-3 text-sm text-zinc-300">
          <span className="shrink-0 font-medium text-zinc-200">
            {t("booking.pickOtherDate")}
          </span>
          <input
            type="date"
            min={firstDate}
            max={lastDate}
            value={value && dates.includes(value) ? value : ""}
            onChange={(e) => {
              const next = e.target.value;
              if (!next || !dates.includes(next)) return;
              if (isCustomerDateDisabled(next, hours, offDays)) return;
              onChange(next);
            }}
            className="min-h-11 flex-1 rounded-lg border-0 bg-zinc-800 px-2 text-zinc-100 [color-scheme:dark]"
            data-testid="booking-date-picker"
          />
        </label>
      ) : null}
    </div>
  );
}
