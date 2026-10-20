"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  /** Caption under the value (Figma: ประมาณจากราคาบริการ) */
  hint?: string;
  icon?: ReactNode;
  /** Quiet secondary cards — smaller type, no emphasis */
  quiet?: boolean;
  delta?: number | null;
  deltaLabel?: string;
}

/** ClipperQ Summary metric: icon+label → big value → caption (no accent border). */
export function StatCard({
  label,
  value,
  hint,
  icon,
  quiet = false,
  delta,
  deltaLabel,
}: StatCardProps) {
  const deltaUp = delta != null && delta > 0;
  const deltaDown = delta != null && delta < 0;
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-3 ${
        quiet ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-zinc-400">
        {icon ? <span className="shrink-0 text-zinc-400">{icon}</span> : null}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p
        className={`font-heading tabular-nums text-zinc-50 ${
          quiet ? "mt-1 text-xl font-semibold" : "mt-2 text-2xl font-semibold"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      {delta != null ? (
        <p
          className={`mt-1 text-xs tabular-nums ${
            deltaUp ? "text-emerald-400" : deltaDown ? "text-red-400" : "text-zinc-500"
          }`}
        >
          {deltaUp ? "▲" : deltaDown ? "▼" : "—"} {Math.abs(delta)}
          {deltaLabel ? ` ${deltaLabel}` : ""}
        </p>
      ) : null}
    </div>
  );
}
