import type { Metadata } from "next";
import Link from "next/link";
import { BarberQxLogo } from "@/components/brand/BarberQxLogo";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน | ClipperQ",
  description: "ข้อกำหนดการใช้งาน ClipperQ",
};

export default function TermsPage() {
  return (
    <main className="min-h-full bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-300">
          <BarberQxLogo className="h-6 w-auto" />
          <span>กลับหน้าแรก</span>
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-zinc-50">ข้อกำหนดการใช้งาน</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-300">
          <p>
            การสมัครทดลองใช้ ClipperQ ผ่านแบบฟอร์มบนเว็บไซต์เป็นการส่งข้อมูลร้านเพื่อให้ทีมติดต่อกลับ
            ไม่ใช่การสร้างบัญชีหรือเปิดใช้งานระบบทันที
          </p>
          <p>
            ทดลองใช้ฟรีตามระยะเวลาที่ระบุ — ไม่ต้องผูกบัตร และไม่มีการตัดเงินอัตโนมัติ
            หากต้องการใช้ต่อหลังทดลอง ค่อยเลือกแพ็กเกจตามจำนวนช่าง
          </p>
          <p>
            ร้านรับผิดชอบค่าแพ็กเกจ LINE OA ของร้านเอง (รวมโควตาข้อความ) ตามนโยบายของ LINE
          </p>
        </div>
        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/privacy" className="text-amber-300 hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>
      </div>
    </main>
  );
}
