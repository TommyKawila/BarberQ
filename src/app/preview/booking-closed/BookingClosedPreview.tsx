import { ShopContactLinks } from "@/components/customer/ShopContactLinks";

/** Static shell matching BookingApp billing-closed state for screenshots. */
export function BookingClosedPreview() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section
        className="flex flex-col gap-4 px-4 py-8"
        data-testid="booking-closed-billing"
      >
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-6">
          <p className="text-xs uppercase tracking-wide text-zinc-500">ClipperQ</p>
          <h1 className="mt-1 text-xl font-bold text-zinc-50">ร้านตัวอย่าง</h1>
        </header>
        <p className="text-base font-semibold text-zinc-100">
          ร้านปิดรับจองออนไลน์ชั่วคราว
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          ขณะนี้ร้านยังไม่เปิดรับจองผ่านระบบออนไลน์ กรุณาติดต่อร้านโดยตรงเพื่อนัดหมาย
        </p>
        <ShopContactLinks
          lineUrl="https://line.me/R/ti/p/@example"
          phone="0812345678"
        />
      </section>
    </main>
  );
}