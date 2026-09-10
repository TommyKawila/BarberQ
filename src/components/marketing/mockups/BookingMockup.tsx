export function BookingMockup() {
  return (
    <div className="mx-auto w-[220px] rounded-[2rem] border-4 border-zinc-700 bg-zinc-900 p-2 shadow-xl" aria-hidden="true">
      <div className="overflow-hidden rounded-[1.5rem] bg-zinc-950">
        <div className="h-20 bg-gradient-to-br from-amber-500/30 to-zinc-800 px-3 pt-3">
          <p className="text-xs font-semibold text-zinc-100">PHINX STUDIO</p>
          <p className="text-[10px] text-zinc-400">จองคิวตัดผม</p>
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-300">
            ดูคิวของฉัน
          </div>
          <p className="text-[10px] text-zinc-500">ช่าง</p>
          <div className="flex gap-1">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] text-amber-300">ช่าง A</span>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[9px] text-zinc-400">ช่าง B</span>
          </div>
          <p className="text-[10px] text-zinc-500">วันที่</p>
          <div className="flex gap-1">
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-medium text-zinc-950">10</span>
            <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400">11</span>
          </div>
          <p className="text-[10px] text-zinc-500">เวลา</p>
          <div className="grid grid-cols-3 gap-1">
            {["10:00", "10:30", "11:00"].map((t) => (
              <span key={t} className="rounded border border-zinc-700 py-0.5 text-center text-[8px] text-zinc-400">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
