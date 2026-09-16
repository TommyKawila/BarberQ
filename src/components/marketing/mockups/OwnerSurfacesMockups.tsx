import { PhoneFrame, type PhoneSize } from "./PhoneFrame";

const PHONE_MOBILE = "mx-auto w-[min(64vw,268px)]";
const PHONE_DESKTOP = "mx-auto w-full max-w-[280px]";
const SCREEN = "flex min-h-[240px] flex-col p-3";

type FrameProps = { size?: PhoneSize; fluid?: boolean; className?: string };

function TodayBoardFrame({ size, fluid, className }: FrameProps) {
  const chips = ["รับคิว", "ปิดรับคิว", "คิววันนี้", "Walk-in"];
  return (
    <PhoneFrame size={size} fluid={fluid} className={className ?? "mx-auto"}>
      <div className={SCREEN}>
        <p className="text-xs font-semibold text-zinc-100">คิววันนี้</p>
        <p className="text-[10px] text-zinc-500">10 ก.ย. 2026</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[8px] text-zinc-400">{c}</span>
          ))}
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
            <p className="text-[10px] font-medium text-zinc-200">ช่าง A · 10:00</p>
            <p className="text-[9px] text-zinc-500">คุณสมชาย</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
            <p className="text-[10px] font-medium text-zinc-200">ช่าง B · 11:30</p>
            <p className="text-[9px] text-zinc-500">คุณวิชัย</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function TeamFrame({ size, fluid, className }: FrameProps) {
  return (
    <PhoneFrame size={size} fluid={fluid} className={className ?? "mx-auto"}>
      <div className={SCREEN}>
        <p className="text-xs font-semibold text-zinc-100">ทีมช่าง</p>
        <div className="mt-2 space-y-1.5">
          {[
            { name: "ช่าง A", status: "เปิดรับคิว" },
            { name: "ช่าง B", status: "ปิดรับคิว" },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2">
              <span className="text-[10px] font-medium text-zinc-200">{b.name}</span>
              <span className="text-[9px] text-amber-400/90">{b.status}</span>
            </div>
          ))}
        </div>
        <p className="mt-auto pt-3 text-[10px] font-medium text-zinc-400">ตารางเวลา · สรุป · ตั้งค่าร้าน</p>
      </div>
    </PhoneFrame>
  );
}

const FRAMES = { queue: TodayBoardFrame, team: TeamFrame } as const;

export function OwnerSurfacePhone({ surface }: { surface: "queue" | "team" }) {
  const Frame = FRAMES[surface];
  return (
    <>
      <div className="lg:hidden">
        <Frame fluid className={PHONE_MOBILE} />
      </div>
      <div className="hidden lg:block">
        <Frame fluid className={PHONE_DESKTOP} />
      </div>
    </>
  );
}
