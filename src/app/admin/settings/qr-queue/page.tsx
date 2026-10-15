"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import { marketingOffer } from "@/lib/marketing/offer";

export default function QrQueueSettingsPage() {
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath, shopSlug } = useShopSlug();
  const [queueAheadPushEnabled, setQueueAheadPushEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const queueUrl = useMemo(() => {
    return buildShopLiffUrl(shopSlug, "/q") ?? buildShopWebUrl(shopSlug, "/q");
  }, [shopSlug]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(shopApi("/settings"), { headers: authHeaders });
      if (res.ok) {
        const s = (await res.json()) as { queueAheadPushEnabled?: boolean };
        setQueueAheadPushEnabled(s.queueAheadPushEnabled !== false);
      }
    } catch {
      /* ignore */
    }
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (!ready || !profile) return;
    void load();
  }, [ready, profile, load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const QR = await import("qrcode");
        const url = await QR.toDataURL(queueUrl, {
          width: 512,
          margin: 2,
          color: { dark: "#18181b", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queueUrl]);

  async function saveToggle(next: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ queueAheadPushEnabled: next }),
      });
      if (!res.ok) {
        setError("บันทึกไม่สำเร็จ");
        return;
      }
      const json = (await res.json()) as { queueAheadPushEnabled?: boolean };
      setQueueAheadPushEnabled(json.queueAheadPushEnabled !== false);
      setMessage("บันทึกแล้ว");
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `barberqx-qr-queue-${shopSlug}.png`;
    a.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(queueUrl);
      setMessage("คัดลอกลิงก์แล้ว");
    } catch {
      setError("คัดลอกไม่สำเร็จ");
    }
  }

  if (!ready || !profile) {
    return <section className="px-4 py-10 text-sm text-zinc-400">กำลังโหลด…</section>;
  }

  if (!isShopOperatorRole(profile.role)) {
    return (
      <AdminShell role={profile.role}>
        <div className="flex flex-col gap-4 px-4 py-5">
          <p className="text-sm text-red-400">เฉพาะเจ้าของร้าน/ผู้จัดการ</p>
          <Link href={shopPath("/admin/settings")} className="text-amber-400">
            กลับ
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-4 px-4 py-5">
        <Link href={shopPath("/admin/settings")} className="text-sm text-zinc-400">
          ← ตั้งค่า
        </Link>
        <h1 className="text-xl font-semibold">QR รับคิว walk-in</h1>
        <p className="text-sm text-zinc-400">
          พิมพ์ QR ติดหน้าร้าน — ลูกค้าสแกนแล้วล็อกอิน LINE เพื่อต่อคิว
        </p>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <div className="mx-auto flex max-w-[280px] flex-col items-center gap-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR คิว walk-in"
                className="h-56 w-56 rounded-xl bg-white p-2"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-zinc-800 text-sm text-zinc-500">
                กำลังสร้าง QR…
              </div>
            )}
            <p className="break-all text-center text-xs text-zinc-500">{queueUrl}</p>
            <button
              type="button"
              onClick={() => downloadQr()}
              disabled={!qrDataUrl}
              className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              ดาวน์โหลด QR
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="min-h-11 w-full rounded-xl border border-zinc-600 text-sm text-zinc-200"
            >
              คัดลอกลิงก์ /q
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">แจ้ง LINE เมื่อเหลืออีก 2 คิว</h2>
              <p className="mt-1 text-sm text-zinc-400">
                ส่งครั้งเดียวต่อคิว · กินโควตา push (ฟรี {marketingOffer.lineFreePushQuota}/เดือน)
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={queueAheadPushEnabled}
                disabled={busy}
                onChange={(e) => {
                  const next = e.target.checked;
                  setQueueAheadPushEnabled(next);
                  void saveToggle(next);
                }}
              />
              <span className="h-7 w-12 rounded-full bg-zinc-700 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:bg-amber-400 peer-checked:after:translate-x-5" />
            </label>
          </div>
        </section>

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </AdminShell>
  );
}
