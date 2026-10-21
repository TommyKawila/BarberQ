"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminPageAuth } from "@/lib/admin/admin-auth-context";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { PlanSnapshot } from "@/lib/billing/plan-state";
import type { PlanPrice } from "@/lib/billing/pricing";
import type { ShopPayment } from "@/lib/billing/types";

export default function BillingPage() {
  const { shopSlug } = useShopSlug();
  const auth = useAdminPageAuth();
  const isOwner = auth.profile?.role === "owner";
  const [plan, setPlan] = useState<PlanSnapshot | null>(null);
  const [price, setPrice] = useState<PlanPrice | null>(null);
  const [priceTable, setPriceTable] = useState<PlanPrice[]>([]);
  const [payments, setPayments] = useState<ShopPayment[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [promptPayMasked, setPromptPayMasked] = useState<string | null>(null);
  const [amountBaht, setAmountBaht] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.profile) return;
    setError(null);
    const headers = getLineAuthHeaders(auth.profile.lineId);
    const [billingRes, qrRes] = await Promise.all([
      fetch(`/api/${shopSlug}/billing`, { headers }),
      fetch(`/api/${shopSlug}/billing/qr`, { headers }),
    ]);
    const billing = (await billingRes.json()) as {
      plan?: PlanSnapshot;
      price?: PlanPrice;
      priceTable?: PlanPrice[];
      payments?: ShopPayment[];
      error?: string;
    };
    if (!billingRes.ok) {
      setError(billing.error ?? "โหลดข้อมูลไม่สำเร็จ");
      return;
    }
    setPlan(billing.plan ?? null);
    setPrice(billing.price ?? null);
    setPriceTable(billing.priceTable ?? []);
    setPayments(billing.payments ?? []);

    if (qrRes.ok) {
      const qrJson = (await qrRes.json()) as {
        qrDataUrl?: string;
        promptPayIdMasked?: string;
        amountBaht?: number;
      };
      setQr(qrJson.qrDataUrl ?? null);
      setPromptPayMasked(qrJson.promptPayIdMasked ?? null);
      setAmountBaht(qrJson.amountBaht ?? null);
    } else {
      setQr(null);
    }
  }, [auth.profile, shopSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File | null) {
    if (!file || !auth.profile) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const form = new FormData();
      form.append("slip", file);
      if (amountBaht != null) form.append("amountBaht", String(amountBaht));
      const res = await fetch(`/api/${shopSlug}/billing/slip`, {
        method: "POST",
        headers: getLineAuthHeaders(auth.profile.lineId),
        body: form,
      });
      const json = (await res.json()) as {
        payment?: ShopPayment;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      const status = json.payment?.status;
      if (status === "verified") setMessage("ชำระเงินสำเร็จ — ต่ออายุแล้ว 1 เดือน");
      else if (status === "pending_review")
        setMessage("ได้รับสลิปแล้ว — รอตรวจสอบโดยทีม ClipperQ");
      else setMessage(`สถานะ: ${status ?? "unknown"}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  if (!auth.ready) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-400">Loading…</p>;
  }

  if (auth.profile && !isOwner) {
    return (
      <p className="px-4 py-10 text-center text-sm text-zinc-400">
        เฉพาะเจ้าของร้านที่เข้าถึงหน้าชำระเงินได้
      </p>
    );
  }

  return (
    <section
      data-testid="billing-page"
      className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6"
    >
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
          ClipperQ Billing
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">ชำระเงิน / ต่ออายุ</h1>
        <p className="text-sm text-zinc-400">
          สถานะ: {plan?.state ?? "—"}
          {plan?.subscribedUntil
            ? ` · ถึง ${new Date(plan.subscribedUntil).toLocaleDateString("th-TH")}`
            : ""}
        </p>
      </header>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-300">ราคาตามจำนวนช่าง</h2>
        <ul className="space-y-1 text-sm text-zinc-400">
          {priceTable.map((row) => (
            <li key={row.tier} className={row.tier === price?.tier ? "text-amber-300" : ""}>
              {row.labelTh}
            </li>
          ))}
        </ul>
        {price?.amountBaht != null ? (
          <p className="text-lg font-semibold text-zinc-50">ยอดที่ต้องโอน ฿{price.amountBaht}</p>
        ) : (
          <p className="text-sm text-amber-300">มากกว่า 10 ช่าง — ติดต่อทีม ClipperQ</p>
        )}
      </div>

      {qr && amountBaht != null ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="PromptPay QR" width={240} height={240} className="rounded-lg bg-white p-2" />
          <p className="text-sm text-zinc-300">PromptPay {promptPayMasked}</p>
          <p className="text-xs text-zinc-500">สแกนแล้วโอน ฿{amountBaht} แล้วอัปโหลดสลิป</p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">ยังไม่ได้ตั้งค่า PromptPay (รอผู้ดูแลระบบ)</p>
      )}

      <label className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-300">
        <span>{uploading ? "กำลังตรวจสอบสลิป…" : "อัปโหลดสลิป PromptPay"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading || price?.amountBaht == null}
          onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
        />
      </label>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {payments.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">ประวัติล่าสุด</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            {payments.slice(0, 5).map((p) => (
              <li key={p.id} className="flex justify-between gap-2 border-b border-zinc-800 pb-2">
                <span>฿{p.amount_baht}</span>
                <span>{p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
