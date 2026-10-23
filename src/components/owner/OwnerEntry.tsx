"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import {
  buildLiffLoginRedirectUri,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";
import type { OwnerShopSummary } from "@/lib/owner/owner-shops";
import {
  OWNER_LIFF_INIT_TIMEOUT_MS,
  OWNER_LIFF_LOGIN_HANDOFF_TIMEOUT_MS,
  ownerEntryPhase,
} from "@/lib/owner/owner-entry-auth";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function OwnerEntry() {
  const router = useRouter();
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shops, setShops] = useState<OwnerShopSummary[]>([]);
  const [shopCount, setShopCount] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShops = useCallback(
    async (lineId?: string) => {
      setShopsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/owner/shops", {
          headers: getLineAuthHeaders(
            mockMode ? (lineId ?? MOCK_OWNER_LINE_ID) : undefined,
          ),
        });
        if (res.status === 401) {
          setLoggedIn(false);
          setShopCount(null);
          setShops([]);
          return;
        }
        if (!res.ok) {
          setError("โหลดร้านไม่สำเร็จ กรุณาลองใหม่");
          setShopCount(null);
          return;
        }
        const data = (await res.json()) as { shops: OwnerShopSummary[] };
        const list = data.shops ?? [];
        setShops(list);
        setShopCount(list.length);
        if (list.length === 1) {
          setRedirecting(true);
          router.replace(`/${list[0].slug}/admin`);
        }
      } catch {
        setError("โหลดร้านไม่สำเร็จ กรุณาลองใหม่");
        setShopCount(null);
      } finally {
        setShopsLoading(false);
      }
    },
    [mockMode, router],
  );

  useEffect(() => {
    let cancelled = false;
    let loginHandoffTimer: ReturnType<typeof setTimeout> | undefined;

    async function boot() {
      if (mockMode) {
        setLoggedIn(true);
        setReady(true);
        await loadShops(MOCK_OWNER_LINE_ID);
        return;
      }

      try {
        await withTimeout(
          liff.init({ liffId: liffId! }),
          OWNER_LIFF_INIT_TIMEOUT_MS,
          "LIFF init timeout",
        );
        if (cancelled) return;

        const inClient = liff.isInClient();
        if (liff.isLoggedIn()) {
          setLoggedIn(true);
          setReady(true);
          await loadShops();
          return;
        }

        // Plain web / desktop Chrome: show login CTA (QR / email). Never auto-login.
        if (!inClient) {
          setLoggedIn(false);
          setReady(true);
          return;
        }

        // Inside LINE LIFF: auto-login; if handoff stalls, unblock with CTA.
        loginHandoffTimer = setTimeout(() => {
          if (cancelled) return;
          setLoggedIn(false);
          setReady(true);
        }, OWNER_LIFF_LOGIN_HANDOFF_TIMEOUT_MS);

        saveLiffReturnPath("/owner");
        liff.login({ redirectUri: buildLiffLoginRedirectUri() });
      } catch {
        if (cancelled) return;
        setError("เริ่ม LINE Login ไม่สำเร็จ");
        setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
      if (loginHandoffTimer) clearTimeout(loginHandoffTimer);
    };
  }, [liffId, loadShops, mockMode]);

  function onLogin() {
    if (mockMode) {
      setLoggedIn(true);
      void loadShops(MOCK_OWNER_LINE_ID);
      return;
    }
    saveLiffReturnPath("/owner");
    liff.login({ redirectUri: buildLiffLoginRedirectUri() });
  }

  const phase = ownerEntryPhase({
    ready,
    loggedIn,
    mockMode,
    shopsLoading,
    shopCount,
    error,
    redirecting,
  });

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <MarketingNav variant="trial" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-50">เข้าหน้าร้านของฉัน</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
          เข้าสู่ระบบด้วย LINE ของเจ้าของร้านหรือช่างที่ผูกไว้แล้ว ระบบจะพาไปบอร์ดคิวของร้านคุณ
        </p>

        {phase === "auth-loading" || phase === "shops-loading" || phase === "redirecting" ? (
          <p className="mt-8 text-sm text-zinc-500" role="status" data-testid="owner-entry-loading">
            {phase === "redirecting" ? "กำลังเข้าหน้าร้าน…" : "กำลังตรวจสอบ…"}
          </p>
        ) : null}

        {phase === "login" ? (
          <div className="mt-8 space-y-3" data-testid="owner-entry-login">
            <p className="text-sm text-zinc-400">
              ล็อกอินด้วย LINE เพื่อเข้าบอร์ดร้าน (บนคอมพิวเตอร์สแกน QR หรือใช้อีเมลได้)
            </p>
            <button
              type="button"
              onClick={onLogin}
              data-testid="owner-entry-line-login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F6AD34] px-6 py-3 text-base font-semibold text-[#111111]"
            >
              เข้าสู่ระบบด้วย LINE
            </button>
          </div>
        ) : null}

        {phase === "empty" ? (
          <div className="mt-8 space-y-4" data-testid="owner-entry-empty">
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
          <ul className="mt-8 space-y-3" data-testid="owner-entry-pick">
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
          <div className="mt-8 space-y-4" data-testid="owner-entry-error">
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
