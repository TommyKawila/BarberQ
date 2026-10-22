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
 * Simulation only — no API / DB writes.
 */
const DEMO_BARBERS = [
  { id: "c1a55e00-d300-4000-a000-000000000011", name: "มิกซ์", nameEn: "Mix", durationMin: 30, priceBaht: 200 },
  { id: "c1a55e00-d300-4000-a000-000000000012", name: "โอ๊ต", nameEn: "Oat", durationMin: 45, priceBaht: 250 },
  { id: "c1a55e00-d300-4000-a000-000000000013", name: "เจ", nameEn: "Jay", durationMin: 30, priceBaht: 200 },
  { id: "c1a55e00-d300-4000-a000-000000000014", name: "นนท์", nameEn: "Non", durationMin: 60, priceBaht: 300 },
] as const;

const SLOT_TIMES = ["10:00", "10:30", "11:00", "14:00", "14:30", "15:30"] as const;

type Step = "barber" | "slot" | "confirm" | "success";
type Tab = "customer" | "shop";
type StoryStep = 1 | 2 | 3;
type QueueStatus = "waiting" | "cutting" | "done" | "noshow";
type DemoBarber = (typeof DEMO_BARBERS)[number];

type DemoQueue = {
  id: string;
  barberId: DemoBarber["id"];
  customer: string;
  time: string;
  priceBaht: number;
  status: QueueStatus;
  fromVisitor: boolean;
};

function priceForDuration(min: number): number {
  if (min >= 60) return 300;
  if (min >= 45) return 250;
  return 200;
}

function seedQueues(): DemoQueue[] {
  return [
    {
      id: "seed-1",
      barberId: DEMO_BARBERS[0].id,
      customer: "คุณเอ (ตัวอย่าง)",
      time: "10:00",
      priceBaht: 200,
      status: "waiting",
      fromVisitor: false,
    },
    {
      id: "seed-2",
      barberId: DEMO_BARBERS[1].id,
      customer: "คุณบี (ตัวอย่าง)",
      time: "10:30",
      priceBaht: 250,
      status: "waiting",
      fromVisitor: false,
    },
    {
      id: "seed-3",
      barberId: DEMO_BARBERS[2].id,
      customer: "คุณซี (ตัวอย่าง)",
      time: "11:00",
      priceBaht: 200,
      status: "waiting",
      fromVisitor: false,
    },
    {
      id: "seed-4",
      barberId: DEMO_BARBERS[3].id,
      customer: "คุณดี (ตัวอย่าง)",
      time: "14:00",
      priceBaht: 300,
      status: "waiting",
      fromVisitor: false,
    },
  ];
}

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

function barberById(id: string): DemoBarber {
  return DEMO_BARBERS.find((b) => b.id === id) ?? DEMO_BARBERS[0];
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
          className="mt-0.5 text-xs font-bold leading-snug"
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
        <p className="mt-3 text-xs leading-snug" style={{ color: WARM_NOTE.ink2 }}>
          {note}
        </p>
      </div>
      <div
        className="border-t px-3.5 py-2.5 text-center text-xs"
        style={{ borderColor: WARM_NOTE.line, color: "#A8A29E" }}
      >
        {brandFooter}
      </div>
    </div>
  );
}

function CustomerPhone({
  step,
  barber,
  dayOffset,
  time,
  days,
  selectedDate,
  timeRange,
  locale,
  reducedMotion,
  t,
  onBack,
  onPickBarber,
  onPickDay,
  onPickSlot,
  onConfirm,
  onSeeShop,
}: {
  step: Step;
  barber: DemoBarber | null;
  dayOffset: number;
  time: string | null;
  days: { offset: number; date: Date }[];
  selectedDate: Date;
  timeRange: string;
  locale: "th" | "en";
  reducedMotion: boolean;
  t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
  onBack: () => void;
  onPickBarber: (b: DemoBarber) => void;
  onPickDay: (offset: number) => void;
  onPickSlot: (slot: string) => void;
  onConfirm: () => void;
  onSeeShop: () => void;
}) {
  const stepTitle =
    step === "barber"
      ? t("marketing.try.stepBarber")
      : step === "slot"
        ? t("marketing.try.stepSlot")
        : step === "confirm"
          ? t("marketing.try.stepConfirm")
          : t("marketing.try.stepSuccess");

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
      <div className="shrink-0 border-b border-zinc-800/80 px-3 pb-2 pt-8">
        <div className="flex items-center gap-1">
          {step !== "barber" && step !== "success" ? (
            <button
              type="button"
              onClick={onBack}
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
            <p className="truncate text-xs text-zinc-500">{stepTitle}</p>
          </div>
          <span className="w-11 shrink-0" aria-hidden />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
        {step === "barber" ? (
          <>
            <ul className="space-y-1.5" role="list">
              {DEMO_BARBERS.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    data-demo-barber={b.id}
                    onClick={() => onPickBarber(b)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-left transition-colors hover:border-amber-400/40 hover:bg-zinc-900"
                  >
                    <BarberAvatar name={b.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-zinc-50">
                        {barberLabel(b, locale)}
                      </span>
                      <span className="block text-[12px] text-zinc-400">
                        {t("marketing.try.duration").replace("{min}", String(b.durationMin))}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p
              className="mt-2 text-center text-[12px] font-semibold tracking-wide text-amber-300/90"
              data-demo-tap-hint
            >
              {t("marketing.try.tapBarber")}
            </p>
          </>
        ) : null}

        {step === "slot" && barber ? (
          <div className="space-y-3">
            <div>
              <p className="text-[12px] font-medium text-zinc-500">{t("marketing.try.dateLabel")}</p>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {days.map(({ offset, date }) => {
                  const selected = offset === dayOffset;
                  return (
                    <button
                      key={offset}
                      type="button"
                      data-demo-day={offset}
                      onClick={() => onPickDay(offset)}
                      className={`inline-flex min-h-11 flex-col items-center justify-center rounded-xl px-1 text-[11px] font-semibold leading-tight ${
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
              <p className="text-[12px] font-medium text-zinc-500">{t("marketing.try.timeLabel")}</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {SLOT_TIMES.map((slot) => {
                  const selected = time === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      data-demo-slot={slot}
                      onClick={() => onPickSlot(slot)}
                      className={`inline-flex min-h-11 items-center justify-center rounded-xl text-[13px] font-semibold tabular-nums ${
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
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
              <div className="flex items-center gap-2.5">
                <BarberAvatar name={barber.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-zinc-50">
                    {barberLabel(barber, locale)}
                  </p>
                  <p className="text-[12px] text-zinc-400">
                    {formatConfirmDate(selectedDate, locale)} · {timeRange}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              data-demo-confirm
              onClick={onConfirm}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-[14px] font-bold text-zinc-950 hover:bg-amber-300"
            >
              <Check size={18} strokeWidth={2.75} aria-hidden />
              {t("marketing.try.confirmCta")}
            </button>
            <p className="text-center text-[12px] leading-snug text-zinc-500">
              {t("marketing.try.disclaimer")}
            </p>
          </div>
        ) : null}

        {step === "success" && barber && time ? (
          <div className="flex h-full flex-col gap-2">
            <div className="rounded-xl bg-[#06C755]/15 px-2.5 py-1.5 text-center text-[12px] font-semibold text-[#7DFFB3]">
              {t("marketing.try.linePushHint")}
            </div>
            <div className="min-h-0 flex-1">
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
            <button
              type="button"
              data-demo-see-shop
              onClick={onSeeShop}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-400/70 bg-amber-400/10 px-3 text-[13px] font-semibold text-amber-200 hover:bg-amber-400/20"
            >
              {t("marketing.try.seeShop")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ShopPhone({
  queues,
  filterBarberId,
  toast,
  revenueBaht,
  noShowCount,
  locale,
  reducedMotion,
  t,
  onFilter,
  onStatus,
}: {
  queues: DemoQueue[];
  filterBarberId: DemoBarber["id"] | "all";
  toast: string | null;
  revenueBaht: number;
  noShowCount: number;
  locale: "th" | "en";
  reducedMotion: boolean;
  t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
  onFilter: (id: DemoBarber["id"] | "all") => void;
  onStatus: (queueId: string, next: "cutting" | "done" | "noshow") => void;
}) {
  const visible = queues.filter(
    (q) => filterBarberId === "all" || q.barberId === filterBarberId,
  );

  return (
    <div className="relative flex h-full flex-col bg-zinc-950 text-zinc-50">
      <div className="shrink-0 border-b border-zinc-800/80 px-3 pb-2 pt-8">
        <p className="text-center text-[11px] font-semibold tracking-wide text-amber-300">
          {t("marketing.try.sampleBadge")}
        </p>
        <p className="mt-0.5 truncate text-center text-[13px] font-semibold text-zinc-100">
          {DEMO_SHOP_DISPLAY_NAME}
        </p>
        <p className="truncate text-center text-[12px] text-zinc-500">
          {t("marketing.try.shopTitle")}
        </p>
      </div>

      {toast ? (
        <div
          role="status"
          data-demo-toast
          className={`mx-3 mt-2 rounded-lg border border-amber-400/40 bg-amber-400/15 px-2.5 py-1.5 text-center text-[12px] font-semibold text-amber-100 ${
            reducedMotion ? "" : "cq-demo-toast-enter"
          }`}
        >
          {toast}
        </div>
      ) : null}

      <div className="mt-2 flex shrink-0 flex-wrap gap-1 px-2 pb-1">
        <button
          type="button"
          data-demo-filter="all"
          onClick={() => onFilter("all")}
          className={`inline-flex min-h-11 items-center rounded-xl px-2.5 text-[12px] font-semibold ${
            filterBarberId === "all"
              ? "bg-amber-400 text-zinc-950"
              : "border border-zinc-700 text-zinc-300"
          }`}
        >
          {t("marketing.try.filterAll")}
        </button>
        {DEMO_BARBERS.map((b) => (
          <button
            key={b.id}
            type="button"
            data-demo-filter={b.id}
            onClick={() => onFilter(b.id)}
            className={`inline-flex min-h-11 items-center rounded-xl px-2.5 text-[12px] font-semibold ${
              filterBarberId === b.id
                ? "bg-amber-400 text-zinc-950"
                : "border border-zinc-700 text-zinc-300"
            }`}
          >
            {locale === "th" ? b.name : b.nameEn}
          </button>
        ))}
      </div>

      <div
        data-demo-summary
        className="mx-2 mt-1 shrink-0 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1.5"
      >
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[13px] font-semibold tabular-nums text-zinc-50">
          <span>
            {t("marketing.try.summaryRevenue")} ฿{revenueBaht.toLocaleString("th-TH")}
          </span>
          <span>
            {t("marketing.try.summaryNoShow")} {noShowCount}
          </span>
        </div>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col justify-start gap-1 px-2 py-1" role="list">
        {visible.map((q) => {
          const b = barberById(q.barberId);
          const closed = q.status === "done" || q.status === "noshow";
          return (
            <li
              key={q.id}
              data-demo-queue={q.id}
              className={`rounded-lg border px-1.5 py-1 ${
                q.fromVisitor
                  ? "border-amber-400/60 bg-amber-400/10"
                  : "border-zinc-800 bg-zinc-900/70"
              } ${!reducedMotion && q.fromVisitor ? "cq-demo-queue-pop" : ""}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold leading-tight tabular-nums text-zinc-50">
                    {q.time} · {q.customer}
                  </p>
                  <p className="truncate text-[12px] leading-tight text-zinc-400">
                    {locale === "th" ? b.name : b.nameEn} · ฿{q.priceBaht}
                  </p>
                </div>
              </div>
              {!closed ? (
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    data-demo-status="cutting"
                    disabled={q.status === "cutting"}
                    onClick={() => onStatus(q.id, "cutting")}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-600 text-[12px] font-semibold leading-none text-zinc-100 disabled:opacity-40"
                  >
                    {t("marketing.try.statusStart")}
                  </button>
                  <button
                    type="button"
                    data-demo-status="done"
                    onClick={() => onStatus(q.id, "done")}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500/90 text-[12px] font-semibold leading-none text-zinc-950"
                  >
                    {t("marketing.try.statusDone")}
                  </button>
                  <button
                    type="button"
                    data-demo-status="noshow"
                    onClick={() => onStatus(q.id, "noshow")}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-400/50 text-[12px] font-semibold leading-none text-red-200"
                  >
                    {t("marketing.try.statusNoShow")}
                  </button>
                </div>
              ) : (
                <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
                  {q.status === "done"
                    ? t("marketing.try.statusDone")
                    : t("marketing.try.statusNoShow")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TryBookingDemo() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("customer");
  const [storyStep, setStoryStep] = useState<StoryStep>(1);
  const [step, setStep] = useState<Step>("barber");
  const [barber, setBarber] = useState<DemoBarber | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [queues, setQueues] = useState<DemoQueue[]>(seedQueues);
  const [filterBarberId, setFilterBarberId] = useState<DemoBarber["id"] | "all">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [revenueBaht, setRevenueBaht] = useState(0);
  const [noShowCount, setNoShowCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = reducedMotion ? 2200 : 3200;
    const id = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(id);
  }, [toast, reducedMotion]);

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
    barber && time ? `${time}–${endTimeLabel(time, barber.durationMin)}` : "";

  const reset = () => {
    setTab("customer");
    setStoryStep(1);
    setStep("barber");
    setBarber(null);
    setDayOffset(0);
    setTime(null);
    setQueues(seedQueues());
    setFilterBarberId("all");
    setToast(null);
    setRevenueBaht(0);
    setNoShowCount(0);
  };

  const goBack = () => {
    if (step === "slot") {
      setStep("barber");
      setTime(null);
      return;
    }
    if (step === "confirm") {
      setStep("slot");
    }
  };

  const goShop = () => {
    setTab("shop");
    if (storyStep < 2) setStoryStep(2);
  };

  const confirmBooking = () => {
    if (!barber || !time) return;
    const visitorQueue: DemoQueue = {
      id: `visitor-${Date.now()}`,
      barberId: barber.id,
      customer: "คุณ (ตัวอย่าง)",
      time,
      priceBaht: priceForDuration(barber.durationMin),
      status: "waiting",
      fromVisitor: true,
    };
    setQueues((prev) => [visitorQueue, ...prev.filter((q) => !q.fromVisitor)]);
    setFilterBarberId(barber.id);
    setToast(
      t("marketing.try.toastNotified").replace("{name}", locale === "th" ? barber.name : barber.nameEn),
    );
    setStep("success");
    setStoryStep(2);
    const delay = reducedMotion ? 0 : 550;
    window.setTimeout(() => setTab("shop"), delay);
  };

  const applyStatus = (queueId: string, next: "cutting" | "done" | "noshow") => {
    const target = queues.find((q) => q.id === queueId);
    if (!target || target.status === "done" || target.status === "noshow") return;
    if (next === "done") {
      setRevenueBaht((n) => n + target.priceBaht);
      setStoryStep(3);
    } else if (next === "noshow") {
      setNoShowCount((n) => n + 1);
      setStoryStep(3);
    }
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId ? { ...q, status: next === "cutting" ? "cutting" : next } : q,
      ),
    );
  };

  const storyLabels = [
    { n: 1 as const, key: "marketing.try.story1" as const },
    { n: 2 as const, key: "marketing.try.story2" as const },
    { n: 3 as const, key: "marketing.try.story3" as const },
  ];

  const phoneClass =
    "mx-auto w-full max-w-[260px] sm:max-w-[270px] lg:max-w-[280px]";

  return (
    <div data-hide-sticky className="flex w-full flex-col items-center gap-3">
      {/* Tabs ลูกค้า | ร้าน — board lives in ร้าน */}
      <div
        role="tablist"
        aria-label={t("marketing.try.tabLabel")}
        className="inline-flex rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-1"
      >
        {(
          [
            { id: "customer" as const, label: t("marketing.try.tabCustomer") },
            { id: "shop" as const, label: t("marketing.try.tabShop") },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            data-demo-tab={item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg px-4 text-[14px] font-semibold ${
              tab === item.id
                ? "bg-amber-400 text-zinc-950"
                : "text-zinc-300 hover:text-zinc-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Story steps */}
      <ol
        className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[12px] font-semibold sm:text-[13px]"
        aria-label={t("marketing.try.storyLabel")}
      >
        {storyLabels.map((s, i) => (
          <li key={s.n} className="flex items-center gap-1.5">
            {i > 0 ? <span className="text-zinc-600" aria-hidden>›</span> : null}
            <span
              className={
                storyStep === s.n
                  ? "text-amber-300"
                  : storyStep > s.n
                    ? "text-zinc-300"
                    : "text-zinc-500"
              }
            >
              <span className="tabular-nums">{s.n}</span> {t(s.key)}
            </span>
          </li>
        ))}
      </ol>

      {/* Phones — one tab on mobile; both on desktop. Queue board = ร้าน tab. */}
      <div className="relative flex w-full flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-10 xl:gap-12">
        <button
          type="button"
          data-demo-reset
          onClick={reset}
          aria-label={t("marketing.try.reset")}
          title={t("marketing.try.reset")}
          className="absolute right-0 top-0 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 lg:right-2"
        >
          <RotateCcw size={14} strokeWidth={2.25} aria-hidden />
        </button>
        <div
          role="tabpanel"
          aria-hidden={tab !== "customer"}
          className={`${tab === "customer" ? "block" : "hidden"} lg:!block`}
        >
          <PhoneFrame size="md" interactive className={phoneClass}>
            <CustomerPhone
              step={step}
              barber={barber}
              dayOffset={dayOffset}
              time={time}
              days={days}
              selectedDate={selectedDate}
              timeRange={timeRange}
              locale={locale}
              reducedMotion={reducedMotion}
              t={t}
              onBack={goBack}
              onPickBarber={(b) => {
                setBarber(b);
                setStep("slot");
              }}
              onPickDay={(offset) => {
                setDayOffset(offset);
                setTime(null);
              }}
              onPickSlot={(slot) => {
                setTime(slot);
                setStep("confirm");
              }}
              onConfirm={confirmBooking}
              onSeeShop={goShop}
            />
          </PhoneFrame>
        </div>

        <div
          role="tabpanel"
          id="board"
          aria-hidden={tab !== "shop"}
          className={`${tab === "shop" ? "block" : "hidden"} scroll-mt-[4.5rem] lg:!block md:scroll-mt-20`}
        >
          <PhoneFrame size="md" interactive className={phoneClass}>
            <ShopPhone
              queues={queues}
              filterBarberId={filterBarberId}
              toast={toast}
              revenueBaht={revenueBaht}
              noShowCount={noShowCount}
              locale={locale}
              reducedMotion={reducedMotion}
              t={t}
              onFilter={setFilterBarberId}
              onStatus={applyStatus}
            />
          </PhoneFrame>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col items-stretch gap-2 text-center sm:mx-auto">
        <p className="text-[12px] leading-snug text-zinc-500">{t("marketing.try.disclaimer")}</p>
        <div data-hide-sticky>
          <PrimaryTrialCta
            labelKey="marketing.try.trialCta"
            placement="try-booking"
            fullWidth
            showRisk={false}
            showAfterClick
            afterClickClassName="text-center"
          />
        </div>
      </div>
    </div>
  );
}
