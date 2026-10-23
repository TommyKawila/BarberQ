"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import type { BillingPeriod } from "@/lib/billing/billing-amount";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

interface SlipRow {
  id: string;
  status: string;
  amount_thb: number;
  period?: string;
  created_at: string;
  reviewed_at: string | null;
}

interface BillingSummary {
  bookableCount: number;
  billingTier: string;
  rangeLabel: string;
  period: BillingPeriod;
  amountThb: number | null;
  priceLabel: string | null;
  monthlyAmountThb: number | null;
  monthlyPriceLabel: string | null;
  yearlyAmountThb: number | null;
  yearlyPriceLabel: string | null;
  yearlySavingsThb: number | null;
  yearlySavingsLabel: string | null;
  dueAt: string;
  trialEndsAt: string;
  paidUntil: string | null;
  overdue: boolean;
  qrDataUrl: string | null;
  qrError: string | null;
  slips: SlipRow[];
}

function formatDue(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const STATUS_TH: Record<string, string> = {
  pending: "รอตรวจสอบ",
  paid: "ชำระแล้ว",
  rejected: "ไม่ผ่าน",
};

const PERIOD_TH: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export default function AdminBillingPage() {
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    try {
      const res = await fetch(
        shopApi(`/billing/summary?period=${period}`),
        { headers: authHeaders },
      );
      if (!res.ok) {
        setError("โหลดข้อมูลบิลไม่สำเร็จ");
        return;
      }
      setSummary((await res.json()) as BillingSummary);
      setError(null);
    } catch {
      setError("โหลดข้อมูลบิลไม่สำเร็จ");
    }
  }, [authHeaders, period, profile, ready, shopApi]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("period", period);
      const res = await fetch(shopApi("/billing/slips"), {
        method: "POST",
        headers: authHeaders,
        body,
      });
      const json = (await res.json()) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setUploadMsg(json.error?.message ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      setUploadMsg("ส่งสลิปแล้ว — ทีมจะตรวจสอบและต่ออายุเมื่ออนุมัติ");
      await load();
    } catch {
      setUploadMsg("อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  if (!ready || !profile) {
    return <p className="px-4 py-8 text-sm text-zinc-500">กำลังโหลด…</p>;
  }

  if (!isShopOperatorRole(profile.role)) {
    return (
      <AdminShell role={profile.role}>
        <p className="px-4 py-8 text-sm text-zinc-400">เฉพาะเจ้าของร้าน/ผู้จัดการ</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-4" data-testid="billing-page">
        <Link
          href={shopPath("/admin/settings")}
          className="text-sm text-zinc-400 underline underline-offset-2"
        >
          ← กลับตั้งค่า
        </Link>

        <header>
          <h1 className="text-xl font-bold text-zinc-50">ชำระค่าบริการ</h1>
          <p className="mt-1 text-sm text-zinc-400">
            ไม่มีการตัดบัตรอัตโนมัติ — สแกน QR PromptPay ตามยอด แล้วอัปโหลดสลิป
          </p>
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {summary ? (
          <>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                แพ็กตามจำนวนช่างรับคิว
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-50">
                {summary.rangeLabel}
                {summary.monthlyPriceLabel ? (
                  <span className="text-amber-400">
                    {" "}
                    · {summary.monthlyPriceLabel}/เดือน
                  </span>
                ) : (
                  <span className="text-zinc-400"> · ติดต่อทีม</span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                ช่างรับคิว {summary.bookableCount} คน · ยอด QR ตามแพ็กนี้
              </p>

              {summary.monthlyAmountThb != null ? (
                <div
                  className="mt-4 grid grid-cols-2 gap-2"
                  data-testid="billing-period-toggle"
                  role="group"
                  aria-label="เลือกรอบชำระ"
                >
                  <button
                    type="button"
                    data-testid="billing-period-monthly"
                    aria-pressed={period === "monthly"}
                    onClick={() => setPeriod("monthly")}
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
                    aria-pressed={period === "yearly"}
                    onClick={() => setPeriod("yearly")}
                    className={
                      period === "yearly"
                        ? "min-h-11 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
                        : "min-h-11 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
                    }
                  >
                    รายปี ลด 20%
                  </button>
                </div>
              ) : null}

              {period === "yearly" && summary.yearlySavingsLabel ? (
                <p
                  className="mt-2 text-xs text-emerald-400"
                  data-testid="billing-yearly-savings"
                >
                  ประหยัด {summary.yearlySavingsLabel}/ปี · จ่ายครั้งเดียว{" "}
                  {summary.yearlyPriceLabel}
                </p>
              ) : null}

              <p className="mt-3 text-sm text-zinc-200">
                วันครบกำหนด:{" "}
                <span className={summary.overdue ? "font-semibold text-red-400" : "text-amber-300"}>
                  {formatDue(summary.dueAt)}
                </span>
                {summary.overdue ? " (เลยกำหนด)" : null}
              </p>
              {summary.paidUntil ? (
                <p className="mt-1 text-xs text-zinc-500">
                  ชำระถึง {formatDue(summary.paidUntil)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  สิ้นสุดทดลองใช้ {formatDue(summary.trialEndsAt)}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">QR PromptPay</p>
              {summary.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL QR
                <img
                  src={summary.qrDataUrl}
                  alt="PromptPay QR"
                  data-testid="billing-promptpay-qr"
                  className="mx-auto mt-3 h-56 w-56 rounded-xl bg-white p-2"
                />
              ) : (
                <p className="mt-3 text-sm text-zinc-400" data-testid="billing-qr-missing">
                  {summary.qrError === "PROMPTPAY_NOT_CONFIGURED"
                    ? "ยังไม่ได้ตั้งค่า PromptPay (ติดต่อทีม ClipperQ)"
                    : summary.qrError === "CONTACT_FOR_PRICE"
                      ? "แพ็กนี้ต้องติดต่อทีมเพื่อกำหนดราคา"
                      : "สร้าง QR ไม่สำเร็จ"}
                </p>
              )}
              {summary.priceLabel ? (
                <p className="mt-2 text-sm text-zinc-300">
                  ยอดโอน{" "}
                  <span
                    className="font-semibold text-amber-400"
                    data-testid="billing-qr-amount"
                  >
                    {summary.priceLabel}
                  </span>
                  <span className="text-zinc-500">
                    {" "}
                    · {period === "yearly" ? "รายปี" : "รายเดือน"}
                  </span>
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-sm font-semibold text-zinc-100">อัปโหลดสลิป</p>
              <p className="mt-1 text-xs text-zinc-500">JPG / PNG / WebP · สูงสุด 5MB</p>
              <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-amber-400/50 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading || summary.amountThb == null}
                  data-testid="billing-slip-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    void onUpload(f);
                  }}
                />
                {uploading ? "กำลังอัปโหลด…" : "เลือกไฟล์สลิป"}
              </label>
              {uploadMsg ? (
                <p className="mt-2 text-sm text-emerald-400" data-testid="billing-upload-msg">
                  {uploadMsg}
                </p>
              ) : null}
            </section>

            {summary.slips.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-zinc-300">ประวัติสลิป</h2>
                <ul className="mt-2 space-y-2">
                  {summary.slips.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2 text-sm"
                    >
                      <span className="text-zinc-300">
                        ฿{s.amount_thb.toLocaleString("th-TH")} ·{" "}
                        {PERIOD_TH[s.period ?? "monthly"] ?? s.period} ·{" "}
                        {STATUS_TH[s.status] ?? s.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDue(s.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : !error ? (
          <p className="text-sm text-zinc-500">กำลังโหลด…</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
