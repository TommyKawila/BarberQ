"use client";

import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { getBangkokWeekday } from "@/lib/services/slot-service";
import type { Barber } from "@/types/booking";

interface DateSelectorProps {
  dates: string[];
  value: string | null;
  barber: Barber | null;
  onChange: (dateISO: string) => void;
}

const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function DateSelector({ dates, value, barber, onChange }: DateSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((dateISO) => {
        const weekday = getBangkokWeekday(dateISO);
        const off = barber?.off_days.includes(weekday) ?? false;
        const selected = dateISO === value && !off;
        const day = parseISO(`${dateISO}T00:00:00`);
        return (
          <button
            key={dateISO}
            type="button"
            disabled={off}
            onClick={() => onChange(dateISO)}
            className={`flex min-w-[3.6rem] flex-col items-center rounded-xl px-3 py-2.5 transition ${
              off
                ? "cursor-not-allowed bg-zinc-900 text-zinc-600"
                : selected
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            <span className="text-[11px] font-medium">{WEEKDAY_TH[weekday]}</span>
            <span className="text-lg font-semibold leading-none">{format(day, "d")}</span>
            <span className="text-[10px]">{format(day, "MMM", { locale: th })}</span>
          </button>
        );
      })}
    </div>
  );
}
