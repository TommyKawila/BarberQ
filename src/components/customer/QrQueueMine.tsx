"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { QrQueuePublicView } from "@/lib/queue/qr-queue-types";

const POLL_MS = 5_000;

export function QrQueueMine() {
  const { shopApi, shopPath } = useShopSlug();
  const { ready, profile, login } = useLineAuth();
  const [view, setView] = useState<QrQueuePublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await fetch(shopApi("/qr-queue/me"), {
        headers: getLineAuthHeaders(profile.userId),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { queue?: QrQueuePublicView | null };
      if (!json.queue) {
        setView(null);
        setGone(true);
      } else {
        setView(json.queue);
        setGone(false);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [profile, shopApi]);

  useEffect(() => {
    if (!ready || !profile) return;
    void load();
    const t = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(t);
  }, [ready, profile, load]);

  async function cancel() {
    if (!profile || !view) return;
    if (!window.confirm("ยกเลิกคิวนี้?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi(`/qr-queue/${view.entry.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getLineAuthHeaders(profile.userId),
        },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        setError(json.error?.message ?? "ยกเลิกไม่สำเร็จ");
        return;
      }
      setView(null);
      setGone(true);
    } catch {
      setError("ยกเลิกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loading) {
    return <p className="px-4 py-10 text-sm text-zinc-400">กำลังโหลดคิว…</p>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-3 px-4 py-8">
        <p className="text-sm text-zinc-300">ต้องล็อกอิน LINE เพื่อดูคิว</p>
        <button
          type="button"
          onClick={() => login()}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          ล็อกอินด้วย LINE
        </button>
      </div>
    );
  }

  if (gone || !view) {
    return (
      <div className="flex flex-col gap-4 px-4 py-8">
        <h1 className="text-xl font-semibold">ยังไม่มีคิวรอ</h1>
        <p className="text-sm text-zinc-400">สแกน QR แล้วต่อคิวใหม่ได้เลย</p>
        <Link
          href={shopPath("/q")}
          className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          ต่อคิว
        </Link>
      </div>
    );
  }

  const barberLabel =
    view.preferredBarberName ??
    (view.entry.preferred_barber_id ? "ช่างที่เลือก" : "ช่างที่ว่างก่อน");

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <p className="text-xs text-zinc-500">คิวของฉัน · อัปเดตอัตโนมัติ</p>
        <h1 className="mt-1 text-2xl font-semibold">ลำดับคิว</h1>
      </div>

      <div className="rounded-2xl bg-zinc-900 p-6 text-center">
        <p className="text-sm text-zinc-400">คุณอยู่ลำดับที่</p>
        <p className="mt-2 text-6xl font-bold tabular-nums text-amber-400">
          {view.position}
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          เหลืออีก {view.ahead} คิว
          {view.waitMinutes > 0 ? ` · ประมาณ ${view.waitMinutes} นาที` : ""}
        </p>
        <p className="mt-2 text-xs text-zinc-500">ช่าง: {barberLabel}</p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void cancel()}
        className="min-h-12 rounded-xl border border-zinc-600 text-sm text-zinc-200 disabled:opacity-50"
      >
        {busy ? "กำลังยกเลิก…" : "ยกเลิกคิว"}
      </button>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
