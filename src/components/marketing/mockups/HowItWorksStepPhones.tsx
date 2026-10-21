import type { ReactNode } from "react";
import { PhoneFrame } from "./PhoneFrame";
import {
  HOW_DEMO_BOOKING,
  WarmNoteFlexCard,
} from "./WarmNoteFlexCard";

const BARBERS = [
  { name: "มิกซ์", en: "Mix", selected: false },
  { name: "โอ๊ต", en: "Oat", selected: false },
  { name: "เจ", en: "Jay", selected: true },
  { name: "นนท์", en: "Non", selected: false },
] as const;

const SLOTS = ["20:00", "20:30", "21:00", "21:30", "22:00"] as const;

function SampleBadge() {
  return (
    <span className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-md border border-amber-400/50 bg-zinc-950/90 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-200 shadow-sm">
      ตัวอย่าง
    </span>
  );
}

function CompactPhoneShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[200px] ${className ?? ""}`} aria-hidden>
      <PhoneFrame fluid className="mx-auto w-full max-w-[200px]">
        {children}
      </PhoneFrame>
      <SampleBadge />
    </div>
  );
}

/** Step 01 — customer picks เจ + 21:30 (same demo queue as 02/03). */
export function HowStepBookPhone() {
  return (
    <CompactPhoneShell>
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
        <div className="shrink-0 border-b border-zinc-800/80 px-2.5 pb-1.5 pt-8">
          <p className="truncate text-center text-[12px] font-semibold text-zinc-100">
            {HOW_DEMO_BOOKING.shopName}
          </p>
          <p className="truncate text-center text-[12px] text-zinc-500">เลือกช่าง · เวลา</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
          <p className="text-[12px] font-medium text-zinc-500">1. เลือกช่าง</p>
          <ul className="space-y-1">
            {BARBERS.map((b) => (
              <li
                key={b.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] ${
                  b.selected
                    ? "border border-amber-400/70 bg-amber-400/15 font-semibold text-amber-100"
                    : "border border-zinc-800 bg-zinc-900/70 text-zinc-300"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-amber-300">
                  {b.name.slice(0, 1)}
                </span>
                <span className="min-w-0 truncate">
                  {b.name} · {b.en}
                </span>
                {b.selected ? (
                  <span className="ml-auto text-[12px] text-amber-300" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[12px] font-medium text-zinc-500">2. เลือกเวลา</p>
          <div className="grid grid-cols-3 gap-1">
            {SLOTS.map((slot) => {
              const selected = slot === HOW_DEMO_BOOKING.timeShort;
              return (
                <span
                  key={slot}
                  className={`inline-flex min-h-9 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                    selected
                      ? "bg-amber-400 text-zinc-950"
                      : "border border-zinc-700 text-zinc-300"
                  }`}
                >
                  {slot}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </CompactPhoneShell>
  );
}

/** Step 02 — LINE OA chat with confirmation + queue card (เจ 21:30). */
export function HowStepLineConfirmPhone() {
  return (
    <CompactPhoneShell>
      <div className="flex h-full flex-col bg-[#747474] text-zinc-900">
        <div className="flex shrink-0 items-center gap-2 bg-[#42607A] px-2.5 pb-2 pt-8 text-white">
          <span className="text-[14px] leading-none" aria-hidden>
            ‹
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">{HOW_DEMO_BOOKING.shopName}</p>
            <p className="text-[12px] text-white/75">Official Account</p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden bg-[#8CABD0] px-2 py-2">
          <p className="text-center text-[12px] font-medium text-zinc-700/90">ข้อความจากร้าน</p>
          <WarmNoteFlexCard
            variant="confirm"
            shopName={HOW_DEMO_BOOKING.shopName}
            barberName={HOW_DEMO_BOOKING.barberName}
            date={HOW_DEMO_BOOKING.date}
            time={HOW_DEMO_BOOKING.time}
            bookingCode={HOW_DEMO_BOOKING.bookingCode}
          />
        </div>
      </div>
    </CompactPhoneShell>
  );
}

/** Step 03 — shop board: new-queue toast + one readable card (เจ 21:30). */
export function HowStepShopNotifyPhone() {
  return (
    <CompactPhoneShell>
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
        <div className="shrink-0 border-b border-zinc-800/80 px-2.5 pb-1.5 pt-8">
          <p className="truncate text-center text-[12px] font-semibold text-zinc-100">
            {HOW_DEMO_BOOKING.shopName}
          </p>
          <p className="truncate text-center text-[12px] text-zinc-500">บอร์ดคิววันนี้</p>
        </div>
        <div className="mx-2 mt-2 rounded-lg border border-amber-400/45 bg-amber-400/15 px-2.5 py-2 text-center text-[12px] font-semibold leading-snug text-amber-100">
          คิวใหม่: ช่าง{HOW_DEMO_BOOKING.barberShort} {HOW_DEMO_BOOKING.timeShort}
        </div>
        <div className="mx-2 mt-2 rounded-xl border border-amber-400/50 bg-zinc-900/90 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tabular-nums text-zinc-50">
                {HOW_DEMO_BOOKING.timeShort} · คุณ (ตัวอย่าง)
              </p>
              <p className="mt-0.5 text-[12px] text-zinc-400">
                ช่าง{HOW_DEMO_BOOKING.barberShort} · LINE · ตัวอย่าง
              </p>
            </div>
            <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[12px] font-semibold text-emerald-300">
              ใหม่
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-snug text-zinc-400">
            แจ้งเตือนถึงช่าง{HOW_DEMO_BOOKING.barberShort}แล้ว
          </p>
        </div>
        <p className="mt-auto px-3 pb-3 pt-2 text-center text-[12px] text-zinc-500">
          ตัวอย่าง — ไม่ใช่คิวจริง
        </p>
      </div>
    </CompactPhoneShell>
  );
}

export function HowItWorksStepPhone({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) return <HowStepBookPhone />;
  if (step === 2) return <HowStepLineConfirmPhone />;
  return <HowStepShopNotifyPhone />;
}
