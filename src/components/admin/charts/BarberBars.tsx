"use client";

import { barberLabel } from "@/types/booking";
import type { StatsBarberRow } from "@/lib/services/stats-service";

interface BarberBarsProps {
  rows: StatsBarberRow[];
  locale: "th" | "en";
  /** e.g. "คิว" / "queues" */
  queueUnit: string;
  /** e.g. "นาทีที่ตัดเสร็จ" — minutes of completed service only */
  completedMinutesLabel: string;
}

export function BarberBars({
  rows,
  locale,
  queueUnit,
  completedMinutesLabel,
}: BarberBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => Math.max(r.minutes, r.completed)), 1);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.barberId} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium">{barberLabel(row.name, locale)}</span>
            <span className="shrink-0 tabular-nums text-zinc-400">
              {row.completed} {queueUnit} · {row.minutes} {completedMinutesLabel}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${(row.minutes / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
