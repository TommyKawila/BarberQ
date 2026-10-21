"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, RotateCcw } from "lucide-react";
import { BarberAvatar } from "@/components/barber/BarberAvatar";
import { PrimaryTrialCta } from "@/components/marketing/PrimaryTrialCta";
import { PhoneFrame } from "@/components/marketing/mockups/PhoneFrame";
import { WARM_NOTE } from "@/components/marketing/mockups/WarmNoteFlexCard";
import { useI18n } from "@/lib/i18n/locale-provider";
import { DEMO_SHOP_DISPLAY_NAME } from "@/lib/marketing/demo-shop";

/**
 * ClipperQ Demo shop barbers (same names/ids as memory-store / seed SQL).
 * No profile photos in repo — initials via BarberAvatar. No fake reviews.
 */
const DEMO_BARBERS = [
  { id: "c1a55e00-d300-4000-a000-000000000011", name: "มิกซ์", nameEn: "Mix", durationMin: 30 },
  { id: "c1a55e00-d300-4000-a000-000000000012", name: "โอ๊ต", nameEn: "Oat", durationMin: 45 },
  { id: "c1a55e00-d300-4000-a000-000000000013", name: "เจ", nameEn: "Jay", durationMin: 30 },
  { id: "c1a55e00-d300-4000-a000-000000000014", name: "นนท์", nameEn: "Non", durationMin: 60 },
] as const;

const SLOT_TIMES = ["10:00", "10:30", "11:00", "14:00", "14:30", "15:30"] as const;

type Step = "barber" | "slot" | "confirm" | "success";

type DemoBarber = (typeof DEMO_BARBERS)[number];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function endTimeLabel(start: string, durationMin: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + durationMin;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function formatDayLabel(date: Date, locale: "th" | "en"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatConfirmDate(date: Date, locale: "th" | "en"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function barberLabel(b: DemoBarber, locale: "th" | "en"): string {
  return locale === "th" ? `${b.name} · ${b.nameEn}` : `${b.nameEn} · ${b.name}`;
}

function DemoLineConfirmCard({
  shopName,
  dateLabel,
  timeRange,
  barberName,
  bookingCode,
  status,
  note,
  barberRow,
  codeRow,
  brandFooter,
  reducedMotion,
}: {
  shopName: string;
  dateLabel: string;
  timeRange: string;
  barberName: string;
  bookingCode: string;
  status: string;
  note: string;
  barberRow: string;
  codeRow: string;
  brandFooter: string;
  reducedMotion: boolean;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-[12px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] ${
        reducedMotion ? "" : "cq-demo-card-enter"
      }`}
      style={{ color: WARM_NOTE.ink }}
      data-demo-confirm-card
    >
      <div
        className="px-3.5 pb-2.5 pt-3"
        style={{ backgroundColor: WARM_NOTE.confirm.tint }}
      >
        <p className="text-[13px] font-bold leading-snug">{shopName}</p>
        <p
          className="mt-0.5 text-[11px] font-bold leading-snug"
          style={{ color: WARM_NOTE.confirm.accentText }}
        >
          {status}
        </p>
      </div>
      <div className="px-3.5 pb-2 pt-3">
        <p className="text-[12px] font-bold leading-snug" style={{ color: WARM_NOTE.ink2 }}>
          {dateLabel}
        </p>
        <p className="text-[18px] font-bold leading-tight tracking-tight">{timeRange}</p>
        <div className="mt-3 border-t" style={{ borderColor: WARM_NOTE.line }} />
        <div className="mt-3 flex gap-2 text-[12px] leading-snug">
          <span className="w-[30%] shrink-0" style={{ color: WARM_NOTE.muted }}>
            {barberRow}
          </span>
          <span className="min-w-0 flex-1 font-bold">{barberName}</span>
        </div>
        <div className="mt-2 flex gap-2 text-[12px] leading-snug">
          <span className="w-[30%] shrink-0" style={{ color: WARM_NOTE.muted }}>
            {codeRow}
          </span>
          <span className="min-w-0 flex-1 font-bold">{bookingCode}</span>
        </div>
        <p className="mt-3 text-[11px] leading-snug" style={{ color: WARM_NOTE.ink2 }}>
          {note}
        </p>
      </div>
      <div
        className="border-t px-3.5 py-2.5 text-center text-[11px]"
        style={{ borderColor: WARM_NOTE.line, color: "#A8A29E" }}
      >
        {brandFooter}
      </div>
    </div>
  );
}

export function TryBookingDemo() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState<Step>("barber");
  const [barber, setBarber] = useState<DemoBarber | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(
    () => [0, 1, 2, 3].map((offset) => ({ offset, date: addDays(today, offset) })),
    [today],
  );

  const selectedDate = addDays(today, dayOffset);
  const timeRange =
    barber && time
      ? `${time}–${endTimeLabel(time, barber.durationMin)}`
      : "";

  const reset = () => {
    setStep("barber");
    setBarber(null);
    setDayOffset(0);
    setTime(null);
  };

  const goBack = () => {
    if (step === "slot") {
      setStep("barber");
      setTime(null);
      return;
    }
    if (step === "confirm") {
      setStep("slot");
      return;
    }
    if (step === "success") {
      reset();
    }
  };

  const stepTitle =
    step === "barber"
      ? t("marketing.try.stepBarber")
      : step === "slot"
        ? t("marketing.try.stepSlot")
        : step === "confirm"
          ? t("marketing.try.stepConfirm")
          : t("marketing.try.stepSuccess");

  return (
    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-14 xl:gap-16">
      <div className="w-full max-w-[300px] sm:max-w-[320px]">
        <PhoneFrame size="lg" interactive className="mx-auto w-full max-w-[300px]">
          <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
            {/* App chrome */}
            <div className="shrink-0 border-b border-zinc-800/80 px-3 pb-2.5 pt-10">
              <div className="flex items-center gap-1">
                {step !== "barber" && step !== "success" ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
                    aria-label={t("marketing.try.back")}
                  >
                    <ChevronLeft size={22} strokeWidth={2.25} />
                  </button>
                ) : (
                  <span className="w-11 shrink-0" aria-hidden />
                )}
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-[13px] font-semibold text-zinc-100">
                    {DEMO_SHOP_DISPLAY_NAME}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">{stepTitle}</p>
                </div>
                <span className="w-11 shrink-0" aria-hidden />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {step === "barber" ? (
                <ul className="space-y-2" role="list">
                  {DEMO_BARBERS.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        data-demo-barber={b.id}
                        onClick={() => {
                          setBarber(b);
                          setStep("slot");
                        }}
                        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-left transition-colors hover:border-amber-400/40 hover:bg-zinc-900 active:bg-zinc-800"
                      >
                        <BarberAvatar name={b.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-zinc-50">
                            {barberLabel(b, locale)}
                          </span>
                          <span className="block text-[12px] text-zinc-400">
                            {t("marketing.try.duration").replace(
                              "{min}",
                              String(b.durationMin),
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {step === "slot" && barber ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-medium text-zinc-500">
                      {t("marketing.try.dateLabel")}
                    </p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {days.map(({ offset, date }) => {
                        const selected = offset === dayOffset;
                        return (
                          <button
                            key={offset}
                            type="button"
                            data-demo-day={offset}
                            onClick={() => {
                              setDayOffset(offset);
                              setTime(null);
                            }}
                            className={`inline-flex min-h-11 min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl px-2.5 text-[12px] font-semibold ${
                              selected
                                ? "bg-amber-400 text-zinc-950"
                                : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            {formatDayLabel(date, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-zinc-500">
                      {t("marketing.try.timeLabel")}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {SLOT_TIMES.map((slot) => {
                        const selected = time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            data-demo-slot={slot}
                            onClick={() => {
                              setTime(slot);
                              setStep("confirm");
                            }}
                            className={`inline-flex min-h-11 items-center justify-center rounded-xl text-[14px] font-semibold tabular-nums ${
                              selected
                                ? "bg-amber-400 text-zinc-950"
                                : "border border-zinc-700 text-zinc-200 hover:border-amber-400/50"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === "confirm" && barber && time ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5">
                    <div className="flex items-center gap-3">
                      <BarberAvatar name={barber.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-zinc-50">
                          {barberLabel(barber, locale)}
                        </p>
                        <p className="text-[13px] text-zinc-400">
                          {formatConfirmDate(selectedDate, locale)} · {timeRange}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-demo-confirm
                    onClick={() => setStep("success")}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-[15px] font-bold text-zinc-950 hover:bg-amber-300"
                  >
                    <Check size={18} strokeWidth={2.75} aria-hidden />
                    {t("marketing.try.confirmCta")}
                  </button>
                  <p className="text-center text-[11px] leading-snug text-zinc-500">
                    {t("marketing.try.disclaimer")}
                  </p>
                </div>
              ) : null}

              {step === "success" && barber && time ? (
                <div className="flex h-full flex-col">
                  <div className="mb-3 rounded-2xl bg-[#06C755]/15 px-3 py-2 text-center text-[12px] font-semibold text-[#7DFFB3]">
                    {t("marketing.try.linePushHint")}
                  </div>
                  <div className="flex flex-1 flex-col justify-center pb-2">
                    <DemoLineConfirmCard
                      shopName={DEMO_SHOP_DISPLAY_NAME}
                      dateLabel={formatConfirmDate(selectedDate, locale)}
                      timeRange={timeRange}
                      barberName={barberLabel(barber, locale)}
                      bookingCode="#DEMO01"
                      status={t("marketing.try.confirmStatus")}
                      note={t("marketing.try.confirmNote")}
                      barberRow={t("marketing.try.confirmBarber")}
                      codeRow={t("marketing.try.confirmCode")}
                      brandFooter={t("marketing.try.brandFooter")}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </PhoneFrame>
      </div>

      <div className="flex w-full max-w-md flex-col items-stretch gap-4 text-center lg:max-w-sm lg:items-start lg:pt-6 lg:text-left">
        {step === "success" ? (
          <>
            <p className="text-base font-semibold leading-snug text-amber-300 sm:text-lg">
              {t("marketing.try.successLead")}
            </p>
            <p className="text-[15px] leading-relaxed text-zinc-300">
              {t("marketing.try.successBody")}
            </p>
          </>
        ) : (
          <p className="text-[15px] leading-relaxed text-zinc-300">
            {t("marketing.try.sideHint")}
          </p>
        )}

        <div className="flex w-full flex-col gap-2.5 sm:mx-auto sm:max-w-[320px] lg:mx-0 lg:max-w-none">
          {step === "success" ? (
            <PrimaryTrialCta
              labelKey="marketing.try.trialCta"
              placement="try-booking"
              fullWidth
              riskClassName="mt-3 justify-center text-[13px] sm:text-sm lg:justify-start"
            />
          ) : null}
          <button
            type="button"
            data-demo-reset
            onClick={reset}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 px-5 text-[15px] font-semibold text-zinc-200 hover:border-zinc-400 hover:bg-zinc-900/60"
          >
            <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
            {t("marketing.try.reset")}
          </button>
        </div>

        <p className="text-[12px] leading-snug text-zinc-500">{t("marketing.try.disclaimer")}</p>
      </div>
    </div>
  );
}
