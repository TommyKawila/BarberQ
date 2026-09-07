"use client";

import type { StatsTrendRow } from "@/lib/services/stats-service";

interface TrendBarsProps {
  rows: StatsTrendRow[];
}

export function TrendBars({ rows }: TrendBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.booked), 1);

  return (
    <div className="flex items-end gap-0.5" style={{ height: 80 }}>
      {rows.map((row) => {
        const h = (row.booked / max) * 100;
        const label = row.dateISO.slice(8);
        return (
          <div key={row.dateISO} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full justify-center" style={{ height: 60 }}>
              <div
                className="w-full max-w-[10px] rounded-t bg-sky-600"
                style={{ height: `${h}%`, marginTop: "auto" }}
                title={`${row.dateISO}: ${row.booked}`}
              />
            </div>
            <span className="text-[8px] text-zinc-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
