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

export function DateSelector({ dates, value, barber, hours, onChange }: DateSelectorProps) {
  const { locale, t } = useI18n();
  const weekdays = locale === "th" ? WEEKDAY_TH : WEEKDAY_EN;
  const dateLocale = locale === "th" ? th : enUS;
  const firstDate = dates[0] ?? null;
  const offDays = barber?.off_days ?? [];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
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
  );
}
