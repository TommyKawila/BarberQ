"use client";

import type { StatsHourRow } from "@/lib/services/stats-service";

interface HourlyBarsProps {
  rows: StatsHourRow[];
  labels: { booked: string; walkIn: string; free: string };
}

export function HourlyBars({ rows, labels }: HourlyBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.booked + r.walkIn + r.free), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {rows.map((row) => {
          const total = row.booked + row.walkIn + row.free;
          const h = (total / max) * 100;
          const bookedH = total > 0 ? (row.booked / total) * h : 0;
          const walkH = total > 0 ? (row.walkIn / total) * h : 0;
          const freeH = total > 0 ? (row.free / total) * h : 0;
          return (
            <div key={row.hour} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col justify-end" style={{ height: 100 }}>
                <div className="flex w-full flex-col overflow-hidden rounded-t" style={{ height: `${h}%` }}>
                  {freeH > 0 ? <div className="bg-zinc-700" style={{ flex: freeH }} /> : null}
                  {walkH > 0 ? <div className="bg-red-600" style={{ flex: walkH }} /> : null}
                  {bookedH > 0 ? <div className="bg-sky-600" style={{ flex: bookedH }} /> : null}
                </div>
              </div>
              <span className="text-[9px] text-zinc-500">{row.hour}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-sky-600" />{labels.booked}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-600" />{labels.walkIn}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-zinc-700" />{labels.free}</span>
      </div>
    </div>
  );
}
