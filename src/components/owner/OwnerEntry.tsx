"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { saveLiffReturnPath } from "@/lib/line/liff-return";
import type { OwnerShopSummary } from "@/lib/owner/owner-shops";

type Phase = "loading" | "login" | "empty" | "pick" | "error";

export function OwnerEntry() {
  const router = useRouter();
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;
  const [phase, setPhase] = useState<Phase>("loading");
  const [shops, setShops] = useState<OwnerShopSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadShops = useCallback(async (lineId?: string) => {
    const res = await fetch("/api/owner/shops", {
      headers: getLineAuthHeaders(mockMode ? lineId ?? MOCK_OWNER_LINE_ID : undefined),
    });
    if (res.status === 401) {
      setPhase("login");
      return;
    }
    if (!res.ok) {
      setError("โหลดร้านไม่สำเร็จ กรุณาลองใหม่");
      setPhase("error");
      return;
    }
    const data = (await res.json()) as { shops: OwnerShopSummary[] };
    const list = data.shops ?? [];
    setShops(list);
    if (list.length === 0) {
      setPhase("empty");
      return;
    }
    if (list.length === 1) {
      router.replace(`/${list[0].slug}/admin`);
      return;
    }
    setPhase("pick");
  }, [mockMode, router]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (mockMode) {
        await loadShops(MOCK_OWNER_LINE_ID);
        return;
      }
      try {
        await liff.init({ liffId: liffId! });
        if (cancelled) return;
        if (!liff.isLoggedIn()) {
          setPhase("login");
          return;
        }
        await loadShops();
      } catch {
        if (cancelled) return;
        setError("เริ่ม LINE Login ไม่สำเร็จ");
        setPhase("error");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [liffId, loadShops, mockMode]);

  function onLogin() {
    if (mockMode) {
      void loadShops(MOCK_OWNER_LINE_ID);
      return;
    }
    saveLiffReturnPath("/owner");
    liff.login({ redirectUri: `${window.location.origin}/owner` });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <MarketingNav variant="trial" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-50">เข้าหน้าร้านของฉัน</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
          เข้าสู่ระบบด้วย LINE ของเจ้าของร้านหรือช่างที่ผูกไว้แล้ว ระบบจะพาไปบอร์ดคิวของร้านคุณ
        </p>

        {phase === "loading" ? (
          <p className="mt-8 text-sm text-zinc-500" role="status">
            กำลังตรวจสอบ…
          </p>
        ) : null}

        {phase === "login" ? (
          <button
            type="button"
            onClick={onLogin}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F6AD34] px-6 py-3 text-base font-semibold text-[#111111]"
          >
            เข้าสู่ระบบด้วย LINE
          </button>
        ) : null}

        {phase === "empty" ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-[15px] text-zinc-300">
              ยังไม่พบร้านที่ผูกกับบัญชี LINE นี้ — ทดลองใช้ฟรี 30 วันได้เลย ไม่ต้องผูกบัตร
            </p>
            <Link
              href="/trial"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F6AD34] px-6 py-3 text-base font-semibold text-[#111111]"
            >
              ไปหน้าทดลองใช้ฟรี
            </Link>
          </div>
        ) : null}

        {phase === "pick" ? (
          <ul className="mt-8 space-y-3">
            {shops.map((shop) => (
              <li key={shop.id}>
                <Link
                  href={`/${shop.slug}/admin`}
                  className="flex min-h-12 items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-[15px] font-medium text-zinc-100 hover:border-[#F6AD34]/50"
                >
                  <span>{shop.name}</span>
                  <span className="text-xs text-zinc-500">/{shop.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {phase === "error" ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-600 px-6 py-3 font-semibold text-zinc-100"
            >
              ลองใหม่
            </button>
          </div>
        ) : null}
      </main>
      <MarketingFooter variant="trial" />
    </div>
  );
}
