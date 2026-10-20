"use client";

/** Generic content-area skeleton (nav stays visible via AdminChrome). */
export function AdminContentSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 px-4 py-5"
      data-testid="admin-content-skeleton"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
      <div className="h-4 w-56 animate-pulse rounded bg-zinc-900" />
      <div className="mt-2 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    </div>
  );
}

/** Team page list skeleton — never shows ช่างในร้าน (0) while loading. */
export function TeamListSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
      data-testid="team-list-skeleton"
      aria-busy="true"
    >
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-zinc-800" : ""}`}
        >
          <div className="mt-0.5 h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-800" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-4 w-36 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
