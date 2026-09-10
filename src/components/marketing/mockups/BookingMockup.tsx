import { PhoneFrame, type PhoneSize } from "./PhoneFrame";

export function BookingMockup({ size = "lg" }: { size?: PhoneSize }) {
  const text =
    size === "sm" ? "text-[9px]" : size === "md" ? "text-[10px]" : size === "xl" ? "text-sm" : "text-xs";
  const label = size === "sm" ? "text-[8px]" : size === "xl" ? "text-[11px]" : "text-[10px]";
  return (
    <PhoneFrame size={size}>
      <div className="h-24 bg-gradient-to-br from-amber-500/30 to-zinc-800 px-3 pt-3">
        <p className={`${text} font-semibold text-zinc-100`}>PHINX STUDIO</p>
        <p className={`${label} text-zinc-400`}>จองคิวตัดผม</p>
      </div>
      <div className="space-y-2.5 p-3">
        <div className={`rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 ${text} text-zinc-300`}>
          ดูคิวของฉัน
        </div>
        <p className={`${label} text-zinc-500`}>ช่าง</p>
        <div className="flex gap-1.5">
          <span className={`rounded-full bg-amber-500/20 px-2.5 py-1 ${label} text-amber-300`}>ช่าง A</span>
          <span className={`rounded-full border border-zinc-700 px-2.5 py-1 ${label} text-zinc-400`}>ช่าง B</span>
        </div>
        <p className={`${label} text-zinc-500`}>วันที่</p>
        <div className="flex gap-1.5">
          <span className={`rounded bg-amber-500 px-2 py-0.5 ${label} font-medium text-zinc-950`}>10</span>
          <span className={`rounded border border-zinc-700 px-2 py-0.5 ${label} text-zinc-400`}>11</span>
        </div>
        <p className={`${label} text-zinc-500`}>เวลา</p>
        <div className="grid grid-cols-3 gap-1.5">
          {["10:00", "10:30", "11:00"].map((t) => (
            <span key={t} className={`rounded border border-zinc-700 py-1 text-center ${label} text-zinc-400`}>{t}</span>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
