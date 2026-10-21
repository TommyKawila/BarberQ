"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import type { PublicDemoColumn } from "@/lib/demo/public-board";
import { demoShopBookingPath } from "@/lib/marketing/demo-shop";

type BoardState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      shopName: string;
      date: string;
      columns: PublicDemoColumn[];
    };

function slotClass(kind: string): string {
  if (kind === "booked") return "bg-sky-800 text-sky-50";
  if (kind === "blocked") return "bg-zinc-700 text-zinc-300";
  return "bg-emerald-800/80 text-emerald-50";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return iso;
  }
}

export function DemoBoard() {
  const [state, setState] = useState<BoardState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/demo/board");
      if (res.status === 404) {
        setState({ status: "missing" });
        return;
      }
      if (!res.ok) {
        setState({ status: "error", message: "โหลดบอร์ดไม่สำเร็จ" });
        return;
      }
      const json = (await res.json()) as {
        shop: { name: string };
        date: string;
        columns: PublicDemoColumn[];
      };
      setState({
        status: "ready",
        shopName: json.shop.name,
        date: json.date,
        columns: json.columns,
      });
    } catch {
      setState({ status: "error", message: "เชื่อมต่อไม่สำเร็จ" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <MarketingNav variant="trial" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        <p className="text-sm font-medium text-[#F6AD34]">ตัวอย่างระบบ · อ่านอย่างเดียว</p>
        <h1 className="mt-2 text-2xl font-bold">บอร์ดคิว ClipperQ Demo</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          ดูภาพรวมบอร์ดหลายช่างได้โดยไม่ต้องล็อกอิน — ไม่มีปุ่มแก้ไข และไม่แสดงเบอร์หรือ LINE ของลูกค้า
        </p>

        {state.status === "loading" ? (
          <p className="mt-8 text-sm text-zinc-500" role="status">
            กำลังโหลดบอร์ด…
          </p>
        ) : null}

        {state.status === "missing" ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-[15px] text-zinc-300">
              ร้านตัวอย่างยังไม่พร้อมในสภาพแวดล้อมนี้ ทีมกำลังเตรียม shop{" "}
              <code className="text-[#F6AD34]">clipperqdemo</code>
            </p>
            <Link
              href="/trial"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F6AD34] px-5 py-3 font-semibold text-[#111111]"
            >
              ทดลองใช้ฟรี 30 วัน
            </Link>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-red-400" role="alert">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-xl border border-zinc-600 px-4 text-sm font-medium"
            >
              ลองใหม่
            </button>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-100">{state.shopName}</p>
                <p className="text-sm text-zinc-500">วันที่ {state.date} (Asia/Bangkok)</p>
              </div>
              <Link
                href={demoShopBookingPath()}
                className="inline-flex min-h-11 items-center rounded-xl border border-[#F6AD34]/60 px-4 text-sm font-semibold text-[#F6AD34]"
              >
                ลองจองคิวตัวอย่าง
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-800" /> ว่าง
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-sky-800" /> จองแล้ว
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-zinc-700" /> บล็อก
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4">
              {state.columns.map((col) => (
                <section
                  key={col.barber.id}
                  className="w-[150px] shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40"
                >
                  <header className="border-b border-zinc-800 px-2.5 py-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {col.barber.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {col.barber.slot_duration_minutes} นาที
                    </p>
                  </header>
                  <ul className="space-y-1 p-2">
                    {col.slots.slice(0, 24).map((slot) => (
                      <li
                        key={`${col.barber.id}-${slot.startTime}`}
                        className={`rounded-md px-2 py-1.5 text-[11px] ${slotClass(slot.kind)}`}
                      >
                        <span className="font-medium">{formatTime(slot.startTime)}</span>
                        {slot.label ? (
                          <span className="ml-1 opacity-90">{slot.label}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              โหมดอ่านอย่างเดียว — ไม่สามารถบล็อกเวลาหรือแก้คิวจากหน้านี้
            </p>
          </div>
        ) : null}
      </main>
      <MarketingFooter variant="trial" />
    </div>
  );
}
