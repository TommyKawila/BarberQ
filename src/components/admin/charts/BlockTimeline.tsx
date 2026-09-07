"use client";

import { formatSlotTime } from "@/lib/services/slot-service";
import { barberLabel } from "@/types/booking";
import type { StatsBlockRow } from "@/lib/services/stats-service";

interface BlockTimelineProps {
  rows: StatsBlockRow[];
  locale: "th" | "en";
  emptyLabel: string;
}

export function BlockTimeline({ rows, locale, emptyLabel }: BlockTimelineProps) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((row, index) => (
        <li key={`${row.barberId}-${row.start}-${index}`} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs">
          <div className="font-medium">{barberLabel(row.barberName, locale)}</div>
          <div className="text-zinc-300">
            {formatSlotTime(row.start)} – {formatSlotTime(row.end)}
          </div>
          <div className="text-zinc-500">{row.reason}</div>
        </li>
      ))}
    </ul>
  );
}
