/** Static billing period toggle for 390px screenshots. */
export function BillingPeriodPreview({
  period,
}: {
  period: "monthly" | "yearly";
}) {
  const amount = period === "yearly" ? "฿5,750" : "฿599";
  return (
    <main className="min-h-screen bg-zinc-950 pb-16 pt-4 text-zinc-50">
      <p className="px-4 text-xs text-zinc-500">Admin preview · billing period</p>
      <section
        className="mx-4 mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
        data-testid="billing-page"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          แพ็กตามจำนวนช่างรับคิว
        </p>
        <p className="mt-1 text-base font-semibold text-zinc-50">
          3–5 ช่าง
          <span className="text-amber-400"> · ฿599/เดือน</span>
        </p>
        <div
          className="mt-4 grid grid-cols-2 gap-2"
          data-testid="billing-period-toggle"
        >
          <button
            type="button"
            data-testid="billing-period-monthly"
            className={
              period === "monthly"
                ? "min-h-11 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
                : "min-h-11 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
            }
          >
            รายเดือน
          </button>
          <button
            type="button"
            data-testid="billing-period-yearly"
            className={
              period === "yearly"
                ? "min-h-11 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
                : "min-h-11 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
            }
          >
            รายปี ลด 20%
          </button>
        </div>
        {period === "yearly" ? (
          <p
            className="mt-2 text-xs text-emerald-400"
            data-testid="billing-yearly-savings"
          >
            ประหยัด ฿1,438/ปี · จ่ายครั้งเดียว ฿5,750
          </p>
        ) : null}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-center">
          <p className="text-sm font-semibold text-zinc-100">QR PromptPay</p>
          <div className="mx-auto mt-3 flex h-40 w-40 items-center justify-center rounded-xl bg-white text-xs text-zinc-500">
            QR
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            ยอดโอน{" "}
            <span
              className="font-semibold text-amber-400"
              data-testid="billing-qr-amount"
            >
              {amount}
            </span>
            <span className="text-zinc-500">
              {" "}
              · {period === "yearly" ? "รายปี" : "รายเดือน"}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}