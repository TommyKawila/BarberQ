"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { useShopBrand } from "@/lib/brand/shop-brand";

interface BarberOption {
  id: string;
  name: string;
}

type Prefer = "first" | string;

export function QrQueueJoin() {
  const router = useRouter();
  const { shopApi, shopPath } = useShopSlug();
  const { shopName } = useShopBrand();
  const { ready, profile, error: authError, login } = useLineAuth();
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [prefer, setPrefer] = useState<Prefer>("first");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarbers = useCallback(async () => {
    try {
      const res = await fetch(shopApi("/qr-queue/barbers"));
      if (!res.ok) return;
      const json = (await res.json()) as { barbers?: BarberOption[] };
      setBarbers(json.barbers ?? []);
    } catch {
      /* ignore */
    }
  }, [shopApi]);

  useEffect(() => {
    if (!ready || !profile) return;
    void loadBarbers();
    // If already waiting, go to my queue
    void (async () => {
      try {
        const res = await fetch(shopApi("/qr-queue/me"), {
          headers: getLineAuthHeaders(profile.userId),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { queue?: unknown };
        if (json.queue) router.replace(shopPath("/q/me"));
      } catch {
        /* ignore */
      }
    })();
  }, [ready, profile, loadBarbers, shopApi, shopPath, router]);

  async function join() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/qr-queue"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getLineAuthHeaders(profile.userId),
        },
        body: JSON.stringify({
          preferredBarberId: prefer === "first" ? null : prefer,
          customerName: profile.displayName || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? "ต่อคิวไม่สำเร็จ");
        return;
      }
      router.push(shopPath("/q/me"));
    } catch {
      setError("ต่อคิวไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="px-4 py-10 text-sm text-zinc-400">กำลังโหลด…</p>;
  }

  if (authError) {
    return (
      <div className="flex flex-col gap-3 px-4 py-8">
        <p className="text-sm text-red-400">{authError}</p>
        <button
          type="button"
          onClick={() => login()}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          ล็อกอิน LINE อีกครั้ง
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-3 px-4 py-8">
        <p className="text-sm text-zinc-300">ต้องล็อกอิน LINE เพื่อต่อคิว</p>
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

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-amber-400/90">คิว walk-in</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {(shopName ?? "").trim() || "ร้านตัดผม"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">เลือกช่างแล้วกดต่อคิว — ไม่ต้องจองล่วงหน้า</p>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-200">เลือกช่าง</p>
        <label
          className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${
            prefer === "first"
              ? "border-amber-400 bg-amber-400/10"
              : "border-zinc-700 bg-zinc-900"
          }`}
        >
          <input
            type="radio"
            name="barber"
            checked={prefer === "first"}
            onChange={() => setPrefer("first")}
            className="accent-amber-400"
          />
          <span className="text-sm font-semibold">ช่างที่ว่างก่อน</span>
          <span className="ml-auto text-xs text-zinc-500">แนะนำ</span>
        </label>
        {barbers.map((b) => (
          <label
            key={b.id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${
              prefer === b.id
                ? "border-amber-400 bg-amber-400/10"
                : "border-zinc-700 bg-zinc-900"
            }`}
          >
            <input
              type="radio"
              name="barber"
              checked={prefer === b.id}
              onChange={() => setPrefer(b.id)}
              className="accent-amber-400"
            />
            <span className="text-sm">{b.name}</span>
          </label>
        ))}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => void join()}
        className="min-h-12 rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 disabled:opacity-50"
      >
        {busy ? "กำลังต่อคิว…" : "ต่อคิว"}
      </button>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
