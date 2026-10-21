import { PhoneFrame, type PhoneSize } from "./PhoneFrame";
import { DEMO_SHOP_DISPLAY_NAME } from "@/lib/marketing/demo-shop";

/** Compact ตาราง (time-grid) preview — matches the phone in the LINE-section photo. */
const BARBERS = ["มิกซ์", "โอ๊ต", "เจ"] as const;
const TIMES = ["10:00", "10:30", "11:00", "14:00", "14:30"] as const;

/** true = booked, false = free. 3 barbers × 5 slots. */
const GRID: boolean[][] = [
  // มิกซ์
  [true, false, true, false, false],
  // โอ๊ต
  [false, true, false, true, false],
  // เจ
  [false, false, true, false, true],
];

type Props = {
  fluid?: boolean;
  matchHeight?: boolean;
  size?: PhoneSize;
  className?: string;
};

/**
 * Non-interactive schedule-tab mockup for the sales LINE section.
 * aria-hidden whole frame — no fake buttons; free/booked use text labels.
 */
export function ScheduleBoardMockup({
  fluid,
  matchHeight,
  size = "md",
  className,
}: Props) {
  return (
    <div className={`relative ${matchHeight ? "h-full w-auto" : ""}`} aria-hidden>
      <PhoneFrame
        size={size}
        fluid={fluid}
        matchHeight={matchHeight}
        className={
          className ??
          (fluid ? "mx-auto w-full max-w-[min(64vw,268px)]" : "mx-auto")
        }
      >
        <div className="flex h-full flex-col overflow-hidden bg-zinc-950 text-zinc-50">
          {/* Status-bar safe + shop chrome */}
          <div className="shrink-0 border-b border-zinc-800/80 px-2.5 pb-1.5 pt-8">
            <p className="truncate text-center text-[12px] font-semibold text-zinc-100">
              {DEMO_SHOP_DISPLAY_NAME}
            </p>
            <p className="truncate text-center text-[12px] text-zinc-500">
              พ. 21 ต.ค. · วันนี้
            </p>
            {/* Segment: คิว | ตาราง — ตาราง selected to match photo */}
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-900 p-0.5">
              <span className="rounded-md px-2 py-1.5 text-center text-[12px] font-medium text-zinc-500">
                คิว
              </span>
              <span className="rounded-md bg-amber-400 px-2 py-1.5 text-center text-[12px] font-semibold text-zinc-950">
                ตาราง
              </span>
            </div>
          </div>

          {/* Time grid — 3 barbers × 5 slots, no horizontal scroll */}
          <div className="min-h-0 flex-1 overflow-hidden px-1.5 py-1.5">
            <div className="grid grid-cols-[2.4rem_repeat(3,minmax(0,1fr))] gap-1">
              <div aria-hidden className="h-7" />
              {BARBERS.map((name) => (
                <div
                  key={name}
                  className="flex h-7 items-center justify-center truncate rounded-md bg-zinc-900 px-0.5 text-[12px] font-semibold text-amber-300"
                >
                  {name}
                </div>
              ))}

              {TIMES.map((time, row) => (
                <div key={time} className="contents">
                  <div className="flex items-center justify-end pr-0.5 text-[12px] font-semibold tabular-nums text-zinc-400">
                    {time}
                  </div>
                  {BARBERS.map((_, col) => {
                    const booked = GRID[col]?.[row] ?? false;
                    return (
                      <div
                        key={`${time}-${col}`}
                        className={`flex min-h-11 flex-col items-center justify-center rounded-md px-0.5 text-center ${
                          booked
                            ? "bg-sky-800 text-sky-50"
                            : "bg-emerald-800 text-emerald-50"
                        }`}
                      >
                        <span className="text-[12px] font-semibold leading-tight">
                          {booked ? "จองแล้ว" : "ว่าง"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PhoneFrame>
      <span className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-md border border-amber-400/50 bg-zinc-950/90 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-200 shadow-sm">
        ตัวอย่าง
      </span>
    </div>
  );
}
