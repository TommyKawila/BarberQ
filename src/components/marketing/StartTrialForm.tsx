"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { buildLiffLoginRedirectUri, saveLiffReturnPath } from "@/lib/line/liff-return";

export function StartTrialForm() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;
  const [ready, setReady] = useState(false);
  const [lineId, setLineId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [shopName, setShopName] = useState("");
  const [barberCount, setBarberCount] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    if (mockMode) {
      setLineId(MOCK_OWNER_LINE_ID);
      setDisplayName("Owner (Mock)");
      setReady(true);
      return;
    }
    try {
      await liff.init({ liffId: liffId! });
      if (!liff.isLoggedIn()) {
        saveLiffReturnPath("/start-trial");
        liff.login({ redirectUri: buildLiffLoginRedirectUri() });
        return;
      }
      const profile = await liff.getProfile();
      setLineId(profile.userId);
      setDisplayName(profile.displayName);
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "LINE login failed");
      setReady(true);
    }
  }, [liffId, mockMode]);

  useEffect(() => {
    void init();
  }, [init]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lineId || !shopName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getLineAuthHeaders(mockMode ? lineId : undefined),
        },
        body: JSON.stringify({
          shopName: shopName.trim(),
          barberCount: Number(barberCount) || 1,
          referrer: "start-trial",
        }),
      });
      const json = (await res.json()) as {
        redirect?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? "ไม่สามารถเริ่มทดลองได้");
      }
      window.location.href = json.redirect ?? "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเริ่มทดลองได้");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <MarketingNav />
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
            ClipperQ
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">เริ่มทดลองใช้ 30 วัน</h1>
          <p className="text-sm text-zinc-400">
            ล็อกอิน LINE แล้วสร้างร้านทันที — เข้า Setup Wizard ได้เลย
          </p>
        </header>

        {!ready ? (
          <p className="text-center text-sm text-zinc-500">กำลังเชื่อมต่อ LINE…</p>
        ) : (
          <form
            data-testid="start-trial-form"
            onSubmit={(e) => void onSubmit(e)}
            className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <p className="text-sm text-zinc-400">
              LINE: {displayName || lineId || "—"}
            </p>
            <label className="block text-sm">
              ชื่อร้าน
              <input
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 outline-none focus:border-amber-500"
                placeholder="เช่น สมชายบาร์เบอร์"
              />
            </label>
            <label className="block text-sm">
              จำนวนช่างโดยประมาณ
              <input
                type="number"
                min={1}
                max={100}
                value={barberCount}
                onChange={(e) => setBarberCount(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 outline-none focus:border-amber-500"
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting || !lineId}
              className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {submitting ? "กำลังสร้างร้าน…" : "เริ่มทดลอง 30 วัน"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500">
          ยังไม่พร้อมล็อกอิน?{" "}
          <Link href="/trial" className="text-amber-400 underline">
            ฝากชื่อไว้ให้ทีมติดต่อ
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
