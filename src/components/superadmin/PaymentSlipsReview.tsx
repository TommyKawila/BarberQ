"use client";

import { useCallback, useEffect, useState } from "react";

interface SlipRow {
  id: string;
  shop_id: string;
  shopName: string;
  shopSlug: string | null;
  amount_thb: number;
  tier: string;
  period?: string;
  status: string;
  created_at: string;
  paidUntil: string | null;
}

const PERIOD_TH: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี (−20%)",
};

export function PaymentSlipsReview({ token }: { token: string }) {
  const [slips, setSlips] = useState<SlipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/payment-slips?status=pending", {
        headers: { "x-superadmin-token": token },
      });
      const json = (await res.json()) as { slips?: SlipRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "โหลดสลิปไม่สำเร็จ");
      setSlips(json.slips ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดสลิปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openImage(id: string) {
    setPreviewUrl(null);
    const res = await fetch(`/api/superadmin/payment-slips/${id}/image`, {
      headers: { "x-superadmin-token": token },
    });
    const json = (await res.json()) as { url?: string };
    if (res.ok && json.url) setPreviewUrl(json.url);
  }

  async function review(id: string, status: "paid" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/superadmin/payment-slips/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        setError(json.error?.message ?? "อัปเดตไม่สำเร็จ");
        return;
      }
      setPreviewUrl(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div data-testid="payment-slips-review">
      <h2 className="mb-3 text-xl font-semibold">
        สลิป PromptPay รอตรวจ ({slips.length})
      </h2>
      {loading ? <p className="text-sm text-zinc-500">กำลังโหลด…</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!loading && slips.length === 0 ? (
        <p className="text-sm text-zinc-500">ไม่มีสลิปรอตรวจ</p>
      ) : null}
      <ul className="space-y-3">
        {slips.map((slip) => (
          <li
            key={slip.id}
            data-testid="payment-slip-row"
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3"
          >
            <p className="text-sm font-semibold text-zinc-100">
              {slip.shopName}
              <span className="ml-2 text-xs font-normal text-amber-300">
                ฿{Number(slip.amount_thb).toLocaleString("th-TH")} · {slip.tier}
              </span>
            </p>
            <p
              className="mt-1 text-xs text-zinc-300"
              data-testid="payment-slip-period"
            >
              รอบชำระ: {PERIOD_TH[slip.period ?? "monthly"] ?? slip.period}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {new Date(slip.created_at).toLocaleString("th-TH")}
              {slip.shopSlug ? ` · /${slip.shopSlug}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-10 rounded-lg border border-zinc-600 px-3 text-xs font-medium text-zinc-200"
                onClick={() => void openImage(slip.id)}
              >
                ดูสลิป
              </button>
              <button
                type="button"
                disabled={busyId === slip.id}
                data-testid="payment-slip-paid"
                className="min-h-10 rounded-lg bg-emerald-500/90 px-3 text-xs font-semibold text-zinc-950 disabled:opacity-50"
                onClick={() => void review(slip.id, "paid")}
              >
                {slip.period === "yearly"
                  ? "อนุมัติ (ต่ออายุ 12 เดือน)"
                  : "อนุมัติ (ต่ออายุ 1 เดือน)"}
              </button>
              <button
                type="button"
                disabled={busyId === slip.id}
                data-testid="payment-slip-reject"
                className="min-h-10 rounded-lg border border-red-500/50 px-3 text-xs font-medium text-red-300 disabled:opacity-50"
                onClick={() => void review(slip.id, "rejected")}
              >
                ปฏิเสธ
              </button>
            </div>
          </li>
        ))}
      </ul>
      {previewUrl ? (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          <p className="mb-2 text-xs text-zinc-400">ตัวอย่างสลิป</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Payment slip"
            data-testid="payment-slip-preview"
            className="max-h-80 w-full rounded-lg object-contain"
          />
          <button
            type="button"
            className="mt-2 text-xs text-zinc-400 underline"
            onClick={() => setPreviewUrl(null)}
          >
            ปิดตัวอย่าง
          </button>
        </div>
      ) : null}
    </div>
  );
}
