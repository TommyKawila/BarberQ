"use client";

import type { StatsHourRow } from "@/lib/services/stats-service";

interface HourlyBarsProps {
  rows: StatsHourRow[];
  labels: { busy: string; blocked: string; free: string };
}

export function HourlyBars({ rows, labels }: HourlyBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(
    ...rows.map((r) => (r.booked ?? 0) + (r.walkIn ?? 0) + (r.blocked ?? 0) + (r.free ?? 0)),
    1,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {rows.map((row) => {
          const busy = (row.booked ?? 0) + (row.walkIn ?? 0);
          const blocked = row.blocked ?? 0;
          const free = row.free ?? 0;
          const total = busy + blocked + free;
          const h = (total / max) * 100;
          const busyH = total > 0 ? (busy / total) * h : 0;
          const blockedH = total > 0 ? (blocked / total) * h : 0;
          const freeH = total > 0 ? (free / total) * h : 0;
          return (
            <div key={row.hour} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col justify-end" style={{ height: 100 }}>
                <div className="flex w-full flex-col overflow-hidden rounded-t" style={{ height: `${h}%` }}>
                  {freeH > 0 ? <div className="bg-zinc-700" style={{ flex: freeH }} title={`${row.chairBusyPct}%`} /> : null}
                  {blockedH > 0 ? <div className="bg-red-700" style={{ flex: blockedH }} /> : null}
                  {busyH > 0 ? <div className="bg-amber-400" style={{ flex: busyH }} /> : null}
                </div>
              </div>
              <span className="text-[11px] text-zinc-500">{row.hour}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-400" />{labels.busy}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-700" />{labels.blocked}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-zinc-700" />{labels.free}</span>
      </div>
    </div>
  );
}
