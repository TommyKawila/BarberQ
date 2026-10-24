"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { enUS, th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isCustomerDateDisabled } from "@/lib/booking/customer-flow";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/dictionary";
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

/** Show custom calendar when the strip is longer than a week. */
const PICKER_THRESHOLD = 7;

function monthKeyFromISO(dateISO: string): string {
  return dateISO.slice(0, 7); // yyyy-MM
}

function buildMonthGrid(monthKey: string): (string | null)[] {
  const anchor = parseISO(`${monthKey}-01T12:00:00`);
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const days = eachDayOfInterval({ start, end });
  const leading = start.getDay(); // 0=Sun
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (const day of days) {
    cells.push(format(day, "yyyy-MM-dd"));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Prefer in-window value; otherwise fall back to today (first bookable date). */
function resolveSafeDate(
  value: string | null,
  bookableSet: Set<string>,
  todayISO: string | null,
): string | null {
  if (value && bookableSet.has(value)) return value;
  return todayISO;
}

export function DateSelector({ dates, value, barber, hours, onChange }: DateSelectorProps) {
  const { locale, t } = useI18n();
  const weekdays = locale === "th" ? WEEKDAY_TH : WEEKDAY_EN;
  const dateLocale = locale === "th" ? th : enUS;
  const firstDate = dates[0] ?? null;
  const lastDate = dates[dates.length - 1] ?? null;
  const offDays = barber?.off_days ?? [];
  const showPicker = dates.length > PICKER_THRESHOLD && firstDate && lastDate;
  const bookableSet = useMemo(() => new Set(dates), [dates]);

  const safeValue = resolveSafeDate(value, bookableSet, firstDate);

  // iOS native picker could set a date far outside the window — snap back to today.
  useEffect(() => {
    if (!value || !firstDate) return;
    if (bookableSet.has(value)) return;
    onChange(firstDate);
  }, [value, firstDate, bookableSet, onChange]);

  const [open, setOpen] = useState(false);
  const [calLocale, setCalLocale] = useState<Locale>(locale);
  const [viewMonth, setViewMonth] = useState(() =>
    monthKeyFromISO(safeValue ?? firstDate ?? format(new Date(), "yyyy-MM-dd")),
  );

  useEffect(() => {
    if (!open) return;
    setCalLocale(locale);
    setViewMonth(monthKeyFromISO(safeValue ?? firstDate ?? format(new Date(), "yyyy-MM-dd")));
  }, [open, locale, safeValue, firstDate]);

  const firstMonth = firstDate ? monthKeyFromISO(firstDate) : null;
  const lastMonth = lastDate ? monthKeyFromISO(lastDate) : null;
  const canPrev = Boolean(firstMonth && viewMonth > firstMonth);
  const canNext = Boolean(lastMonth && viewMonth < lastMonth);
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const calWeekdays = calLocale === "th" ? WEEKDAY_TH : WEEKDAY_EN;
  const calDateLocale = calLocale === "th" ? th : enUS;
  const monthLabel = format(parseISO(`${viewMonth}-01T12:00:00`), "MMMM yyyy", {
    locale: calDateLocale,
  });

  function selectDate(dateISO: string) {
    if (!bookableSet.has(dateISO)) return;
    if (isCustomerDateDisabled(dateISO, hours, offDays)) return;
    onChange(dateISO);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {dates.map((dateISO) => {
          const weekday = getBangkokWeekday(dateISO);
          const disabled = isCustomerDateDisabled(dateISO, hours, offDays);
          const selected = dateISO === safeValue && !disabled;
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-zinc-900 px-3 text-left text-sm text-zinc-200"
          data-testid="booking-date-picker"
        >
          <span className="font-medium">{t("booking.pickOtherDate")}</span>
          <span className="tabular-nums text-amber-400">
            {safeValue
              ? format(parseISO(`${safeValue}T00:00:00`), "d MMM", { locale: dateLocale })
              : "—"}
          </span>
        </button>
      ) : null}

      {open && firstDate && lastDate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label={t("common.cancel")}
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-date-calendar-title"
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-zinc-950 px-4 pb-8 pt-3 shadow-xl sm:rounded-2xl"
            data-testid="booking-date-calendar"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />

            <div className="mb-3 flex items-center justify-between gap-2">
              <h2
                id="booking-date-calendar-title"
                className="text-base font-semibold text-zinc-50"
              >
                {t("booking.pickOtherDate")}
              </h2>
              <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCalLocale("th")}
                  className={`min-h-9 rounded-md px-2.5 ${
                    calLocale === "th"
                      ? "bg-amber-400 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  aria-pressed={calLocale === "th"}
                >
                  TH
                </button>
                <button
                  type="button"
                  onClick={() => setCalLocale("en")}
                  className={`min-h-9 rounded-md px-2.5 ${
                    calLocale === "en"
                      ? "bg-amber-400 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  aria-pressed={calLocale === "en"}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() =>
                  setViewMonth(format(addMonths(parseISO(`${viewMonth}-01T12:00:00`), -1), "yyyy-MM"))
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-sm font-semibold capitalize text-amber-400">{monthLabel}</p>
              <button
                type="button"
                disabled={!canNext}
                onClick={() =>
                  setViewMonth(format(addMonths(parseISO(`${viewMonth}-01T12:00:00`), 1), "yyyy-MM"))
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500">
              {calWeekdays.map((label) => (
                <span key={label} className="py-1">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((dateISO, index) => {
                if (!dateISO) {
                  return <span key={`empty-${index}`} className="h-11" />;
                }
                const inWindow = bookableSet.has(dateISO);
                const closedOrOff = isCustomerDateDisabled(dateISO, hours, offDays);
                const disabled = !inWindow || closedOrOff;
                const selected = dateISO === safeValue && !disabled;
                const isToday = dateISO === firstDate;
                return (
                  <button
                    key={dateISO}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(dateISO)}
                    className={`flex h-11 flex-col items-center justify-center rounded-xl text-sm tabular-nums transition ${
                      disabled
                        ? "cursor-not-allowed text-zinc-600"
                        : selected
                          ? "bg-amber-400 font-semibold text-zinc-950"
                          : isToday
                            ? "bg-zinc-800 font-medium text-amber-300 hover:bg-zinc-700"
                            : "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                    }`}
                  >
                    {Number(dateISO.slice(8, 10))}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-zinc-300"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
