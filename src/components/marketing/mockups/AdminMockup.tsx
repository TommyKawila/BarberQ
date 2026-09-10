export function AdminMockup() {
  const chips = ["รับคิว", "ปิดรับคิว", "คิววันนี้", "Walk-in"];
  return (
    <div className="mx-auto w-[220px] rounded-[2rem] border-4 border-zinc-700 bg-zinc-900 p-2 shadow-xl" aria-hidden="true">
      <div className="overflow-hidden rounded-[1.5rem] bg-zinc-950 p-3">
        <p className="text-xs font-semibold text-zinc-100">บอร์ดวันนี้</p>
        <p className="mt-0.5 text-[10px] text-zinc-500">10 ก.ย. 2026</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-full border border-zinc-700 px-1.5 py-0.5 text-[8px] text-zinc-400">{c}</span>
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
    </div>
  );
}
