import { PhoneFrame, type PhoneSize } from "./PhoneFrame";

const PHONE = "mx-auto";
const PHONE_MOBILE = "mx-auto w-[min(64vw,268px)]";
const SCREEN = "flex min-h-[240px] flex-col";

type FrameProps = { size?: PhoneSize; fluid?: boolean };

function CoverFrame({ size, fluid }: FrameProps) {
  return (
    <PhoneFrame size={size} fluid={fluid} className={fluid ? PHONE_MOBILE : PHONE}>
      <div className={SCREEN}>
        <div className="h-28 bg-gradient-to-br from-amber-500/40 to-zinc-800 px-3 pt-4">
          <p className="text-xs font-semibold text-zinc-100">PHINX STUDIO</p>
          <p className="text-[10px] text-zinc-400">จองคิวตัดผม</p>
        </div>
        <div className="p-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-[10px] text-zinc-300">
            ดูคิวของฉัน
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function BarberDateFrame({ size, fluid }: FrameProps) {
  return (
    <PhoneFrame size={size} fluid={fluid} className={fluid ? PHONE_MOBILE : PHONE}>
      <div className={`${SCREEN} justify-center space-y-2 p-3`}>
        <p className="text-[10px] text-zinc-500">ช่าง</p>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] text-amber-300">ช่าง A</span>
          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-400">ช่าง B</span>
        </div>
        <p className="text-[10px] text-zinc-500">วันที่</p>
        <div className="flex gap-1">
          {["10", "11", "12"].map((d, i) => (
            <span key={d} className={`rounded px-2 py-0.5 text-[10px] ${i === 0 ? "bg-amber-500 font-medium text-zinc-950" : "border border-zinc-700 text-zinc-400"}`}>{d}</span>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500">เวลา</p>
        <div className="grid grid-cols-3 gap-1">
          {["10:00", "10:30", "11:00"].map((t, i) => (
            <span key={t} className={`rounded py-1 text-center text-[9px] ${i === 1 ? "bg-amber-500 text-zinc-950" : "border border-zinc-700 text-zinc-400"}`}>{t}</span>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

function SummaryFrame({ size, fluid }: FrameProps) {
  return (
    <PhoneFrame size={size} fluid={fluid} className={fluid ? PHONE_MOBILE : PHONE}>
      <div className={`${SCREEN} p-3`}>
        <p className="text-xs font-semibold text-zinc-200">สรุปการจอง</p>
        <div className="mt-2 space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-[10px] text-zinc-400">
          <p>ช่าง A · 10 ก.ย.</p>
          <p>10:30 · 30 นาที</p>
          <p className="text-zinc-300">คุณสมชาย</p>
        </div>
        <div className="mt-auto rounded-lg bg-amber-500 py-2 text-center text-[10px] font-semibold text-zinc-950">
          ยืนยัน
        </div>
      </div>
    </PhoneFrame>
  );
}

const FRAMES = [CoverFrame, BarberDateFrame, SummaryFrame] as const;

export function CustomerStepPhone({ step }: { step: 1 | 2 | 3 }) {
  const Frame = FRAMES[step - 1];
  return (
    <>
      <div className="lg:hidden">
        <Frame fluid />
      </div>
      <div className="hidden lg:block">
        <Frame size="md" />
      </div>
    </>
  );
}
