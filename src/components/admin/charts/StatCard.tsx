"use client";

interface StatCardProps {
  label: string;
  value: number;
  accent?: "sky" | "emerald" | "red" | "amber";
}

const accentClass: Record<NonNullable<StatCardProps["accent"]>, string> = {
  sky: "border-l-sky-500",
  emerald: "border-l-emerald-500",
  red: "border-l-red-500",
  amber: "border-l-amber-400",
};

export function StatCard({ label, value, accent = "sky" }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-zinc-800 border-l-4 bg-zinc-900/80 p-3 ${accentClass[accent]}`}>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  );
}
