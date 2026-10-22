"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import {
  CHECKLIST_STILL_IMAGE,
  type SupportChecklistProgress,
  type SupportChecklistItemId,
} from "@/lib/support/checklist";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";

const LABELS: Record<SupportChecklistItemId, string> = {
  shop_info: "ข้อมูลร้าน",
  barbers: "ช่างในร้าน",
  services: "บริการและราคา",
  hours: "เวลาเปิดร้าน",
  test_booking: "ทดลองจองคิว",
};

export function OnboardingChecklistCard({
  progress,
  onAskTeam,
  asking,
}: {
  progress: SupportChecklistProgress;
  onAskTeam: () => void;
  asking?: boolean;
}) {
  if (progress.allDone) {
    return (
      <section
        data-testid="support-onboarding-checklist"
        className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
      >
        <h2 className="font-heading text-base font-semibold text-zinc-100">
          ร้านพร้อมใช้งานแล้ว
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          ครบ {progress.total}/{progress.total} ขั้นตอน — ทีมยังช่วยได้ตลอด 24 ชม.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="support-onboarding-checklist"
      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
    >
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-base font-semibold text-zinc-100">
            ตั้งค่าร้านให้พร้อมใช้
          </h2>
          <p className="text-xs text-zinc-500">{SUPPORT_REPLY_SLA_COPY_TH}</p>
        </div>
        <p className="text-sm font-medium text-amber-400">
          {progress.completed}/{progress.total}
        </p>
      </div>

      <div
        className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800"
        role="progressbar"
        aria-valuenow={progress.completed}
        aria-valuemin={0}
        aria-valuemax={progress.total}
      >
        <div
          className="h-full rounded-full bg-amber-400 transition-[width]"
          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {progress.items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="cq-press flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-2 py-2"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CHECKLIST_STILL_IMAGE[item.id]}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                />
              </div>
              <span className="min-w-0 flex-1 text-sm font-medium text-zinc-100">
                {LABELS[item.id]}
              </span>
              {item.done ? (
                <Check size={18} className="shrink-0 text-amber-400" aria-label="เสร็จแล้ว" />
              ) : (
                <Circle size={18} className="shrink-0 text-zinc-600" aria-label="ยังไม่เสร็จ" />
              )}
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        data-testid="support-ask-team-setup"
        disabled={asking}
        onClick={onAskTeam}
        className="cq-press mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {asking ? "กำลังส่ง…" : "ขอให้ทีมช่วยตั้งค่า"}
      </button>
    </section>
  );
}
