/** Decorative chat pile — interruption overwhelm, not a live inbox. */
export function PainChatMockup({
  messages,
  times,
  footer,
  unreadLabel,
  className = "",
}: {
  messages: string[];
  times: string[];
  footer: string;
  unreadLabel: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full max-w-lg justify-self-center lg:max-w-none lg:justify-self-end ${className}`}
    >
      {/* Soft ambient glow behind the pile */}
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-amber-400/5 blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-zinc-700/80 bg-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3.5">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-200">
              LINE
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-[0_0_0_2px_#09090b]">
              {unreadLabel}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-zinc-50">ลูกค้า · ทั้งวัน</p>
            <p className="truncate text-xs text-zinc-500">{footer}</p>
          </div>
        </div>

        {/* Stacked / overlapping bubbles */}
        <div className="relative space-y-0 px-3 py-5 sm:px-4">
          {messages.map((text, i) => {
            const offsets = [
              "translate-x-0 rotate-[-1.2deg] z-[1]",
              "translate-x-2 rotate-[0.8deg] z-[2] -mt-1",
              "translate-x-0 rotate-[-0.6deg] z-[3] -mt-1",
              "translate-x-3 rotate-[1.1deg] z-[4] -mt-1",
            ];
            return (
              <div
                key={i}
                className={`relative flex flex-col items-start ${offsets[i] ?? ""}`}
              >
                <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-zinc-700/60 bg-zinc-800 px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.35)] sm:max-w-[88%]">
                  <p className="text-[15px] font-medium leading-snug text-zinc-100 sm:text-base md:text-[1.05rem]">
                    {text}
                  </p>
                  <p className="mt-1.5 text-right text-[11px] tabular-nums text-zinc-500">
                    {times[i] ?? ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
