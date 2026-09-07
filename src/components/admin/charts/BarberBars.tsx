"use client";

import { barberLabel } from "@/types/booking";
import type { StatsBarberRow } from "@/lib/services/stats-service";

interface BarberBarsProps {
  rows: StatsBarberRow[];
  locale: "th" | "en";
  minuteLabel: string;
}

export function BarberBars({ rows, locale, minuteLabel }: BarberBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.minutes), 1);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.barberId} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{barberLabel(row.name, locale)}</span>
            <span className="text-zinc-400">{row.minutes} {minuteLabel}</span>
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
