export function ShopExpiredBookingMessage({ shopName }: { shopName: string }) {
  return (
    <section
      data-testid="shop-expired-booking"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 py-16 text-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {shopName}
      </p>
      <h1 className="text-xl font-semibold text-zinc-50">ยังไม่เปิดรับจองชั่วคราว</h1>
      <p className="text-sm leading-relaxed text-zinc-400">
        ร้านกำลังต่ออายุระบบจอง — ข้อมูลคิวเดิมยังอยู่ครบ
        กรุณาลองใหม่ภายหลัง หรือติดต่อร้านโดยตรง
      </p>
    </section>
  );
}
