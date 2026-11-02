"use client";

import { useMemo, useState } from "react";
import { fromZonedTime } from "date-fns-tz";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { TodayQueueCards } from "@/components/admin/TodayQueueCards";
import { CqIcon } from "@/components/icons/CqIcon";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn } from "@/types/booking";

const OPEN: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "00:00",
  close: "23:59",
}));

function addMinutesISO(base: Date, minutes: number): string {
  return new Date(base.getTime() + minutes * 60_000).toISOString();
}

function buildColumns(now: Date): AdminColumn[] {
  return [
    {
      barber: {
        id: "hgg",
        name: "HGG",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        {
          startTime: addMinutesISO(now, -30),
          endTime: addMinutesISO(now, 0),
          available: false,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 0),
          endTime: addMinutesISO(now, 30),
          available: false,
          kind: "booked",
          customerName: "คุณเอ (ตัวอย่าง)",
          status: "confirmed",
          source: "line",
          appointmentId: "a1",
          appointmentStart: addMinutesISO(now, 0),
          appointmentEnd: addMinutesISO(now, 30),
        },
        {
          startTime: addMinutesISO(now, 30),
          endTime: addMinutesISO(now, 60),
          available: true,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 60),
          endTime: addMinutesISO(now, 90),
          available: true,
          kind: "free",
        },
      ],
    },
    {
      barber: {
        id: "ken",
        name: "Ken",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        {
          startTime: addMinutesISO(now, -5),
          endTime: addMinutesISO(now, 25),
          available: true,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 25),
          endTime: addMinutesISO(now, 55),
          available: false,
          kind: "booked",
          customerName: "คุณบี (ตัวอย่าง)",
          status: "confirmed",
          source: "line",
          appointmentId: "a2",
          appointmentStart: addMinutesISO(now, 25),
          appointmentEnd: addMinutesISO(now, 55),
          isLate: true,
        },
        {
          startTime: addMinutesISO(now, 55),
          endTime: addMinutesISO(now, 85),
          available: true,
          kind: "free",
        },
      ],
    },
    {
      barber: {
        id: "pop",
        name: "POP",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        {
          startTime: addMinutesISO(now, -10),
          endTime: addMinutesISO(now, 20),
          available: true,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 20),
          endTime: addMinutesISO(now, 50),
          available: true,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 50),
          endTime: addMinutesISO(now, 80),
          available: true,
          kind: "free",
        },
        {
          startTime: addMinutesISO(now, 80),
          endTime: addMinutesISO(now, 480),
          available: true,
          kind: "free",
        },
      ],
    },
    {
      barber: {
        id: "peter",
        name: "Peter",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        {
          startTime: addMinutesISO(now, 45),
          endTime: addMinutesISO(now, 75),
          available: false,
          kind: "booked",
          customerName: "Walk-in #2 (ตัวอย่าง)",
          status: "confirmed",
          source: "walk_in",
          appointmentId: "a3",
          appointmentStart: addMinutesISO(now, 45),
          appointmentEnd: addMinutesISO(now, 75),
          isLate: true,
        },
        {
          startTime: addMinutesISO(now, 75),
          endTime: addMinutesISO(now, 105),
          available: true,
          kind: "free",
        },
      ],
    },
  ];
}

/** Pre-open schedule fixture: early free slots before shop open 10:30. */
function buildPreOpenColumns(day: string): AdminColumn[] {
  const t = (hm: string) => fromZonedTime(`${day}T${hm}:00`, SHOP_TIMEZONE).toISOString();
  return [
    {
      barber: {
        id: "hgg",
        name: "HGG",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        { startTime: t("09:00"), endTime: t("09:30"), available: true, kind: "free" },
        { startTime: t("09:30"), endTime: t("10:00"), available: true, kind: "free" },
        { startTime: t("10:00"), endTime: t("10:30"), available: true, kind: "free" },
        { startTime: t("10:30"), endTime: t("11:00"), available: true, kind: "free" },
        {
          startTime: t("11:00"),
          endTime: t("11:30"),
          available: false,
          kind: "booked",
          customerName: "คุณเอ",
          status: "confirmed",
          source: "line",
          appointmentId: "b1",
        },
        { startTime: t("11:30"), endTime: t("12:00"), available: true, kind: "free" },
      ],
    },
    {
      barber: {
        id: "ken",
        name: "Ken",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        { startTime: t("09:00"), endTime: t("09:30"), available: true, kind: "free" },
        { startTime: t("09:30"), endTime: t("10:00"), available: true, kind: "free" },
        { startTime: t("10:00"), endTime: t("10:30"), available: true, kind: "free" },
        { startTime: t("10:30"), endTime: t("11:00"), available: true, kind: "free" },
        { startTime: t("11:00"), endTime: t("11:30"), available: true, kind: "free" },
        {
          startTime: t("11:30"),
          endTime: t("12:00"),
          available: false,
          kind: "booked",
          customerName: "คุณบี",
          status: "confirmed",
          source: "line",
          appointmentId: "b2",
          isLate: true,
        },
      ],
    },
    {
      barber: {
        id: "nick",
        name: "Nick",
        slot_duration_minutes: 30,
        off_days: [],
        created_at: "",
        is_bookable: true,
        is_active: true,
        role: "barber",
      },
      slots: [
        {
          startTime: t("10:30"),
          endTime: t("11:00"),
          available: false,
          kind: "blocked",
          reason: "day_off",
        },
        {
          startTime: t("11:00"),
          endTime: t("11:30"),
          available: false,
          kind: "blocked",
          reason: "day_off",
        },
        {
          startTime: t("11:30"),
          endTime: t("12:00"),
          available: false,
          kind: "blocked",
          reason: "day_off",
        },
      ],
    },
  ];
}

const PRE_OPEN_HOURS: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "10:30",
  close: "20:00",
}));

export function TodayRound1Preview() {
  const [tab, setTab] = useState<"queue" | "schedule">("queue");
  const now = useMemo(() => new Date(), []);
  const queueColumns = useMemo(() => buildColumns(now), [now]);
  const scheduleColumns = useMemo(() => buildPreOpenColumns("2026-11-02"), []);

  return (
    <div className="mx-auto min-h-screen max-w-[390px] bg-zinc-950 pb-8 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="font-heading text-sm font-semibold">ClipperQ Demo</p>
          <p className="text-xs text-zinc-500">Today Round 1 preview</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <CqIcon name="refresh" size={18} />
        </div>
      </header>

      <div className="flex gap-2 px-4 py-3" data-testid="today-round1-tabs">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold ${
            tab === "queue" ? "border-amber-400 text-zinc-50" : "border-zinc-700 text-zinc-400"
          }`}
        >
          คิว
        </button>
        <button
          type="button"
          onClick={() => setTab("schedule")}
          className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold ${
            tab === "schedule" ? "border-amber-400 text-zinc-50" : "border-zinc-700 text-zinc-400"
          }`}
        >
          ตาราง
        </button>
      </div>

      <main className="space-y-4 px-3">
        {tab === "queue" ? (
          <TodayQueueCards
            columns={queueColumns}
            shopHours={OPEN}
            onWalkInBarber={() => undefined}
            onOutcome={() => undefined}
            onLateOrNoShow={() => undefined}
          />
        ) : (
          <QuickBlockGrid
            columns={scheduleColumns}
            pendingKey={null}
            shopHours={PRE_OPEN_HOURS}
            dateISO="2026-11-02"
            onFreeSlot={() => undefined}
            walkInShopBanner="ร้านเปิด 10:30 · แตะช่องว่างเพื่อลงคิว"
          />
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-600 text-sm"
          >
            <CqIcon name="block" size={18} />
            บล็อกเวลา
          </button>
          <button
            type="button"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
          >
            <CqIcon name="walkin" size={18} />
            Walk-in
          </button>
        </div>

        <nav
          className="mt-4 flex items-stretch justify-around rounded-2xl border border-zinc-800 bg-zinc-900 px-1 py-2"
          aria-label="Preview nav"
        >
          {(
            [
              { name: "today" as const, label: "วันนี้", active: true },
              { name: "team" as const, label: "ทีมช่าง", active: false },
              { name: "summary" as const, label: "สรุป", active: false },
              { name: "more" as const, label: "เพิ่มเติม", active: false },
            ] as const
          ).map((item) => (
            <div
              key={item.name}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl mx-1 px-1 text-xs ${
                item.active
                  ? "bg-amber-400 font-semibold text-zinc-950"
                  : "font-medium text-zinc-500"
              }`}
            >
              <CqIcon name={item.name} size={20} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </main>
    </div>
  );
}
