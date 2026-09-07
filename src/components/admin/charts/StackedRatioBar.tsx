"use client";

interface StackedRatioBarProps {
  completed: number;
  cancelled: number;
  noShow: number;
  pending: number;
  labels: { completed: string; cancelled: string; noShow: string; pending: string };
}

export function StackedRatioBar({
  completed,
  cancelled,
  noShow,
  pending,
  labels,
}: StackedRatioBarProps) {
  const total = completed + cancelled + noShow + pending;
  if (total === 0) {
    return <p className="text-xs text-zinc-500">{labels.pending}</p>;
  }
  const pct = (n: number) => `${(n / total) * 100}%`;
  const items = [
    { n: completed, color: "bg-amber-400", label: labels.completed },
    { n: cancelled, color: "bg-red-500", label: labels.cancelled },
    { n: noShow, color: "bg-orange-600", label: labels.noShow },
    { n: pending, color: "bg-sky-600", label: labels.pending },
  ].filter((item) => item.n > 0);

  return (
    <div className="space-y-2">
      <div className="flex h-8 overflow-hidden rounded-lg">
        {items.map((item) => (
          <div key={item.label} className={item.color} style={{ width: pct(item.n) }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-400">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
            {item.label} ({item.n})
          </span>
        ))}
      </div>
    </div>
  );
}
