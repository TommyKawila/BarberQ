"use client";

import { PhoneFrame } from "./PhoneFrame";
import { useI18n } from "@/lib/i18n/locale-provider";

function PhoneA() {
  const { t } = useI18n();
  return (
    <PhoneFrame
      fluid
      className="-rotate-[3deg] w-[220px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] ring-1 ring-amber-400/20 md:w-[320px]"
    >
      <div className="relative h-24 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black px-3 pb-2.5 pt-3 md:h-28">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="relative flex h-full flex-col justify-end">
          <p className="text-[8px] font-medium uppercase tracking-wide text-zinc-300 md:text-[10px]">
            {t("booking.shopTitleEyebrow")}
          </p>
          <p className="text-[11px] font-semibold leading-tight text-white md:text-sm">
            PHINX STUDIO
          </p>
          <p className="text-[8px] text-zinc-300 md:text-[10px]">{t("booking.shopSubtitle")}</p>
        </div>
      </div>
      <div className="space-y-2 p-2.5 md:space-y-2.5 md:p-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-[9px] text-zinc-300 md:text-[11px]">
          {t("booking.viewMyBookings")}
        </div>
        <p className="text-[8px] text-zinc-500 md:text-[10px]">{t("booking.barber")}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 rounded-xl border-2 border-amber-400 bg-zinc-900 px-2 py-1.5">
            <span className="h-6 w-6 shrink-0 rounded-full bg-amber-400/25 md:h-7 md:w-7" />
            <span className="text-[9px] font-semibold text-zinc-100 md:text-[11px]">
              {t("booking.barber")} A
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border-2 border-transparent bg-zinc-800 px-2 py-1.5">
            <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-700 md:h-7 md:w-7" />
            <span className="text-[9px] font-semibold text-zinc-300 md:text-[11px]">
              {t("booking.barber")} B
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function PhoneB() {
  const { t, locale } = useI18n();
  const dates =
    locale === "en"
      ? [
          { dow: "Thu", day: "10", month: "Sep" },
          { dow: "Fri", day: "11", month: "Sep", selected: true },
          { dow: "Sat", day: "12", month: "Sep" },
        ]
      : [
          { dow: "พฤ", day: "10", month: "ก.ย." },
          { dow: "ศ", day: "11", month: "ก.ย.", selected: true },
          { dow: "ส", day: "12", month: "ก.ย." },
        ];
  const slots = ["10:00", "10:30", "11:00", "11:30", "13:00", "13:30"];

  return (
    <PhoneFrame
      fluid
      className="z-10 mt-8 w-[192px] rotate-[3deg] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] ring-1 ring-amber-400/20 md:mt-12 md:w-[285px]"
    >
      <div className="space-y-2 p-2.5 md:space-y-3 md:p-3">
        <p className="text-[8px] text-zinc-500 md:text-[10px]">{t("booking.date")}</p>
        <div className="flex gap-1.5">
          {dates.map((d) => (
            <div
              key={d.day}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-1.5 md:py-2 ${
                d.selected ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-100"
              }`}
            >
              <span className="text-[7px] font-medium md:text-[9px]">{d.dow}</span>
              <span className="text-[11px] font-semibold leading-none md:text-sm">{d.day}</span>
              <span className="text-[7px] md:text-[9px]">{d.month}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-zinc-500 md:text-[10px]">{t("booking.time")}</p>
        <div className="grid grid-cols-3 gap-1 md:gap-1.5">
          {slots.map((slot) => (
            <span
              key={slot}
              className={`rounded-lg py-1.5 text-center text-[8px] font-semibold md:py-2.5 md:text-[10px] ${
                slot === "10:30"
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {slot}
            </span>
          ))}
        </div>
        <div className="rounded-lg bg-amber-400 py-2 text-center text-[9px] font-semibold text-zinc-950 md:py-2.5 md:text-[11px]">
          {t("booking.confirmBooking")}
        </div>
      </div>
    </PhoneFrame>
  );
}

export function HeroPhoneMockups() {
  return (
    <div className="hero-phones-enter relative flex w-full items-end justify-center overflow-x-clip py-2 lg:justify-end">
      <PhoneA />
      <div className="-ml-10 md:-ml-16">
        <PhoneB />
      </div>
    </div>
  );
}
