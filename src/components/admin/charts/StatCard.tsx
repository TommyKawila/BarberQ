"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "sky" | "emerald" | "red" | "amber" | "zinc";
  delta?: number | null;
  deltaLabel?: string;
  highlight?: boolean;
  /** Optional secondary line (e.g. QR subset of walk-in) */
  hint?: string;
}

const accentClass: Record<NonNullable<StatCardProps["accent"]>, string> = {
  sky: "border-l-sky-500",
  emerald: "border-l-emerald-500",
  red: "border-l-red-500",
  amber: "border-l-amber-400",
  zinc: "border-l-zinc-600",
};

export function StatCard({
  label,
  value,
  accent = "zinc",
  delta,
  deltaLabel,
  highlight = false,
  hint,
}: StatCardProps) {
  const deltaUp = delta != null && delta > 0;
  const deltaDown = delta != null && delta < 0;
  return (
    <div
      className={`rounded-xl border border-zinc-800 border-l-4 bg-zinc-900 p-3 ${accentClass[accent]} ${
        highlight ? "ring-1 ring-amber-400/40" : ""
      }`}
    >
      <p
        className={`font-heading tabular-nums ${
          highlight ? "text-3xl font-semibold text-amber-400" : "text-2xl font-semibold text-zinc-100"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
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
