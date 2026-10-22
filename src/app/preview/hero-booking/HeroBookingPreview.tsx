"use client";

import { BarberSelector } from "@/components/customer/BarberSelector";
import { DateSelector } from "@/components/customer/DateSelector";
import { ReminderLeadChips } from "@/components/customer/ReminderLeadChips";
import { SlotPicker } from "@/components/customer/SlotPicker";
import { useI18n } from "@/lib/i18n/locale-provider";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";
import type { Barber, Slot } from "@/types/booking";

/** Demo barbers — same names as ClipperQ Demo / HOW_DEMO_BOOKING (เจ · Jay). */
const DEMO_BARBERS: Barber[] = [
  {
    id: "barber-jay",
    name: "เจ (ตัวอย่าง)",
    slot_duration_minutes: 30,
    off_days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    shop_id: "demo-shop",
    role: "barber",
    is_bookable: true,
    is_active: true,
    profile_image_url: null,
    show_profile_in_booking: true,
  },
  {
    id: "barber-non",
    name: "นนท์ (ตัวอย่าง)",
    slot_duration_minutes: 60,
    off_days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    shop_id: "demo-shop",
    role: "barber",
    is_bookable: true,
    is_active: true,
    profile_image_url: null,
    show_profile_in_booking: true,
  },
  {
    id: "barber-mix",
    name: "มิกซ์ (ตัวอย่าง)",
    slot_duration_minutes: 30,
    off_days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    shop_id: "demo-shop",
    role: "barber",
    is_bookable: true,
    is_active: true,
    profile_image_url: null,
    show_profile_in_booking: true,
  },
  {
    id: "barber-oat",
    name: "โอ๊ต (ตัวอย่าง)",
    slot_duration_minutes: 45,
    off_days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    shop_id: "demo-shop",
    role: "barber",
    is_bookable: true,
    is_active: true,
    profile_image_url: null,
    show_profile_in_booking: true,
  },
];

/** Wed 28 Oct 2026 — future vs capture “today” so SlotPicker keeps evening slots. */
const DEMO_DATE = "2026-10-28";
const DEMO_DATES = [
  "2026-10-28",
  "2026-10-29",
  "2026-10-30",
  "2026-10-31",
  "2026-11-01",
  "2026-11-02",
  "2026-11-03",
];

/** 21:30 Asia/Bangkok = 14:30 UTC on 2026-10-28 */
const SELECTED_START = "2026-10-28T14:30:00.000Z";

const DEMO_SLOTS: Slot[] = ["20:00", "20:30", "21:00", "21:30", "22:00"].map((hm) => {
  const [hh, mm] = hm.split(":").map(Number);
  const start = new Date(Date.UTC(2026, 9, 28, hh! - 7, mm));
  const end = new Date(start.getTime() + 30 * 60_000);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    available: true,
  };
});

const HOURS = DEFAULT_SHOP_HOURS.map((d) => ({ ...d, close: "23:00" }));

/**
 * Review/capture-only: real booking selectors with demo selections (เจ · 21:30 · 30 นาที).
 * No customer name/phone — nothing personal.
 */
export function HeroBookingPreview() {
  const { t } = useI18n();
  const jay = DEMO_BARBERS[0]!;

  return (
    <ShopSlugProvider shopSlug="clipperqdemo">
      <main className="min-h-dvh bg-zinc-950 text-zinc-50">
        <div className="mx-auto flex w-full max-w-[390px] flex-col border-x border-zinc-900 pb-40">
          <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
            <p className="text-sm font-semibold text-zinc-50">ClipperQ Demo</p>
            <p className="text-xs text-zinc-500">by ClipperQ</p>
          </header>

          <div className="flex flex-col gap-5 px-4 py-4">
            <section className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepBarber")}</h2>
              <p className="text-sm text-zinc-400">{t("booking.selectBarberHint")}</p>
              <BarberSelector barbers={DEMO_BARBERS} value={jay.id} onChange={() => {}} />
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepDate")}</h2>
              <p className="text-sm text-zinc-400">{t("booking.selectDateHint")}</p>
              <DateSelector
                dates={DEMO_DATES}
                value={DEMO_DATE}
                barber={jay}
                hours={HOURS}
                onChange={() => {}}
              />
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepTime")}</h2>
              <p className="mt-0.5 text-sm text-zinc-400">{t("booking.selectTimeHint")}</p>
              <SlotPicker
                slots={DEMO_SLOTS}
                value={SELECTED_START}
                loading={false}
                dateKey={DEMO_DATE}
                skipAutoScroll
                onChange={() => {}}
              />
            </section>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[390px] border-t border-zinc-800 bg-zinc-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.45)]">
            <div className="mb-3">
              <ReminderLeadChips
                startTimeIso={SELECTED_START}
                value={30}
                onChange={() => {}}
                label={t("booking.reminderLead")}
                hint={t("booking.reminderLeadHint")}
                t={t}
                now={new Date("2026-10-28T10:00:00.000Z")}
              />
            </div>
            <button
              type="button"
              className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 shadow-[0_0_24px_rgba(246,173,52,0.35)]"
            >
              {t("booking.confirmBooking")}
            </button>
          </div>
        </div>
      </main>
    </ShopSlugProvider>
  );
}
