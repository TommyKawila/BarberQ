import { PhoneFrame } from "./PhoneFrame";

function TodayBoardFrame() {
  const chips = ["รับคิว", "ปิดรับคิว", "คิววันนี้", "Walk-in"];
  return (
    <PhoneFrame size="md">
      <div className="p-3">
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

function TeamFrame() {
  return (
    <PhoneFrame size="md" className="md:-mt-6 md:rotate-1">
      <div className="p-3">
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
        <p className="mt-3 text-[10px] font-medium text-zinc-400">ตารางเวลา · สรุป · ตั้งค่าร้าน</p>
      </div>
    </PhoneFrame>
  );
}

export function OwnerSurfacesMockups({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <TodayBoardFrame />
        <TeamFrame />
      </div>
    );
  }
  return (
    <div className="relative flex items-end justify-center gap-4 lg:justify-start">
      <TodayBoardFrame />
      <TeamFrame />
    </div>
  );
}
