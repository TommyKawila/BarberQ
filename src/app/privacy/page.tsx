import type { Metadata } from "next";
import Link from "next/link";
import { BarberQxLogo } from "@/components/brand/BarberQxLogo";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | ClipperQ",
  description: "นโยบายความเป็นส่วนตัวของ ClipperQ",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-full bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-300">
          <BarberQxLogo className="h-6 w-auto" />
          <span>กลับหน้าแรก</span>
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-zinc-50">นโยบายความเป็นส่วนตัว</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-300">
          <p>
            ClipperQ เก็บข้อมูลที่จำเป็นต่อการให้บริการจองคิวผ่าน LINE เช่น ชื่อร้าน
            ช่องทางติดต่อ และข้อมูลการจองของลูกค้าร้าน
          </p>
          <p>
            ข้อมูลลูกค้าเป็นของร้านค้า — เราไม่ขายข้อมูลให้บุคคลที่สาม และไม่ขอรหัสผ่าน
            LINE OA ของร้าน
          </p>
          <p>
            หากมีคำถามเรื่องความเป็นส่วนตัว ทักทีม ClipperQ ทาง LINE ได้โดยตรง
          </p>
        </div>
        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/terms" className="text-amber-300 hover:underline">
            ข้อกำหนดการใช้งาน
          </Link>
        </p>
      </div>
    </main>
  );
}
