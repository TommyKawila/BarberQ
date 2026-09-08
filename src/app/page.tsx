import Link from "next/link";
import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col px-4 py-10">
      <LiffCallbackRedirect />
      <header className="text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500">BarberQ</p>
        <h1 className="mt-2 text-3xl font-bold">ระบบจองคิวร้านตัดผม</h1>
        <p className="mt-3 text-sm text-zinc-400">
          ลูกค้ากดจองจาก Line OA ของร้าน คุณได้บอร์ดคิวโดยไม่ต้องสร้างระบบเอง
        </p>
      </header>

      <ul className="mt-8 space-y-3 text-sm text-zinc-300">
        <li>ติดปุ่ม «กดจองคิว» บน OA ร้านที่มีลูกค้าอยู่แล้ว</li>
        <li>ไม่ต้องสร้าง LIFF ของร้านเอง ใช้ของ BarberQ</li>
        <li>ค่าแจ้งเตือนจะรวมในรายเดือน (ส่งจาก OA BarberQ ในเฟสถัดไป)</li>
      </ul>

      <div className="mt-10 flex flex-col gap-3 text-center">
        <a
          href="/phinxstudio"
          className="min-h-12 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-zinc-950"
        >
          ตัวอย่างร้าน — PHINX STUDIO
        </a>
        <Link href="/guide" className="text-sm text-zinc-400 underline">
          คู่มือติดปุ่มบน Line OA
        </Link>
      </div>
    </div>
  );
}
