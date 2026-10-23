import Link from "next/link";

/** Static shell matching TierBillingNotice for 390px screenshots. */
export function BillingBannerPreview({
  overdue,
  graceDaysLeft,
}: {
  overdue: boolean;
  graceDaysLeft: number;
}) {
  const shellClass = overdue
    ? "mx-4 mt-3 rounded-2xl border border-red-500/50 bg-red-950/40 px-4 py-3"
    : "mx-4 mt-3 rounded-2xl border border-amber-500/35 bg-zinc-900 px-4 py-3";
  const ctaClass = overdue
    ? "flex min-h-11 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-semibold text-white"
    : "flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950";

  return (
    <main className="min-h-screen bg-zinc-950 pb-16 pt-4 text-zinc-50">
      <p className="px-4 text-xs text-zinc-500">Admin preview · billing banner</p>
      <section
        data-testid="tier-billing-notice"
        data-overdue={overdue ? "true" : "false"}
        className={shellClass}
      >
        {overdue ? (
          <>
            <p
              className="text-sm font-semibold text-red-300"
              data-testid="tier-notice-overdue-headline"
            >
              เลยกำหนดชำระแล้ว
            </p>
            {graceDaysLeft > 0 ? (
              <p
                className="mt-1 text-sm text-red-200/90"
                data-testid="tier-notice-grace-days"
              >
                เหลือเวลาผ่อนผัน {graceDaysLeft} วัน
              </p>
            ) : null}
            <p className="mt-1 text-sm leading-relaxed text-zinc-100">
              เหลือเวลาผ่อนผัน {graceDaysLeft} วันก่อนระบบจะปิดรับจองออนไลน์จากลูกค้าใหม่
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-zinc-100">
              ร้านคุณมีช่างรับคิว 3 คน แพ็กที่เหมาะคือ 3–5 ช่าง ฿599/เดือน
              ไม่มีการตัดบัตรอัตโนมัติ ชำระผ่าน QR PromptPay ในหน้าชำระเงินก่อนวันครบกำหนด
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              ใช้ได้ตามปกติ · ไม่ล็อกร้าน · ไม่มีการตัดบัตรอัตโนมัติ
            </p>
          </>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="#"
            data-testid="tier-notice-billing"
            className={ctaClass}
          >
            {overdue ? "ชำระเงินเลย" : "ไปหน้าชำระเงิน PromptPay"}
          </Link>
        </div>
      </section>
    </main>
  );
}
