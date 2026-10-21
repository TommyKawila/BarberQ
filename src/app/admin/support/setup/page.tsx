"use client";

import { TodaySupportChecklist } from "@/components/support/TodaySupportChecklist";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";

export default function SupportSetupPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="font-heading text-xl font-semibold text-zinc-100">
          ตั้งค่าร้านครั้งแรก
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{SUPPORT_REPLY_SLA_COPY_TH}</p>
      </header>
      <TodaySupportChecklist />
    </div>
  );
}
