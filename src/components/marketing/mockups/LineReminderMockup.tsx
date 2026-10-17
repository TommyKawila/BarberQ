import { PhoneFrame } from "./PhoneFrame";

/** LINE chat mock for the signature “confirmation + reminder” section. */
export function LineReminderMockup({
  shopName,
  title,
  body,
  whenLabel,
  cta,
}: {
  shopName: string;
  title: string;
  body: string;
  whenLabel: string;
  cta: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[200px] shrink-0 lg:max-w-[220px]">
      <PhoneFrame fluid className="mx-auto w-full">
        <div className="flex h-full flex-col bg-[#747474] text-[11px] leading-snug text-zinc-900">
          {/* Fake iOS status-bar safe area */}
          <div className="flex h-[11%] shrink-0 items-end justify-between px-[5%] pb-[1.5%] text-[10px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1 opacity-90">
              <span className="inline-block h-[7px] w-[14px] rounded-[2px] border border-white/80" />
            </span>
          </div>

          {/* LINE-like chat chrome */}
          <div className="flex items-center gap-2 bg-[#42607A] px-3 py-2 text-white">
            <span className="text-sm leading-none">‹</span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[12px] font-semibold">{shopName}</span>
              <span className="text-[9px] text-white/70">Official Account</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-hidden bg-[#8CABD0] px-2.5 py-3">
            <p className="text-center text-[9px] text-zinc-700/80">{whenLabel}</p>
            <div className="ml-1 max-w-[92%] overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="bg-amber-400/90 px-2.5 py-1.5 text-[10px] font-bold text-zinc-950">
                BarberQx
              </div>
              <div className="space-y-1.5 px-2.5 py-2">
                <p className="text-[11px] font-semibold text-zinc-900">{title}</p>
                <p className="text-[10px] text-zinc-600">{body}</p>
                <div className="rounded-lg bg-zinc-100 px-2 py-1.5 text-[10px] text-zinc-700">
                  <p>นัท · Nat</p>
                  <p className="font-semibold text-zinc-900">พรุ่งนี้ 18:30</p>
                  <p>BarberQx Demo · 60 นาที</p>
                </div>
                <div className="rounded-lg bg-[#06C755] py-1.5 text-center text-[10px] font-semibold text-white">
                  {cta}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}
