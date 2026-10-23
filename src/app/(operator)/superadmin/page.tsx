"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LineSupportInbox } from "@/components/superadmin/LineSupportInbox";
import { QuickAddShopForm } from "@/components/superadmin/QuickAddShopForm";
import { ShopCard } from "@/components/superadmin/ShopCard";
import {
  readOperatorToken,
  writeOperatorToken,
} from "@/lib/superadmin/operator-session";
import type { Shop } from "@/types/booking";

type SuperadminShop = Shop & {
  overTier?: boolean;
  seatBookableCount?: number;
  seatFlags?: string[];
  recommendedTier?: string;
  recommendedTierLabel?: string;
  recommendedPriceLabel?: string | null;
  showBillingNotice?: boolean;
};

type CancelFeedbackRow = {
  id: string;
  shop_id: string;
  shopName: string;
  shopSlug: string | null;
  reason: string;
  reasonLabel: string;
  detail: string | null;
  bookable_count: number | null;
  recommended_tier: string | null;
  created_at: string;
};

export default function SuperAdminPage() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shops, setShops] = useState<SuperadminShop[]>([]);
  const [cancelFeedback, setCancelFeedback] = useState<CancelFeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const recommendedShops = useMemo(() => {
    return shops
      .filter((s) => s.status !== "pending")
      .slice()
      .sort((a, b) => (b.seatBookableCount ?? 0) - (a.seatBookableCount ?? 0));
  }, [shops]);

  const loadShops = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const [shopsRes, feedbackRes] = await Promise.all([
        fetch("/api/superadmin/shops", {
          headers: { "x-superadmin-token": authToken },
        }),
        fetch("/api/superadmin/cancel-feedback", {
          headers: { "x-superadmin-token": authToken },
        }),
      ]);
      const shopsJson = (await shopsRes.json()) as {
        shops?: SuperadminShop[];
        error?: string;
      };
      if (!shopsRes.ok) throw new Error(shopsJson.error ?? "Invalid token");
      setShops(shopsJson.shops ?? []);
      if (feedbackRes.ok) {
        const fbJson = (await feedbackRes.json()) as {
          feedback?: CancelFeedbackRow[];
        };
        setCancelFeedback(fbJson.feedback ?? []);
      } else {
        setCancelFeedback([]);
      }
      setIsAuthenticated(true);
      writeOperatorToken(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsAuthenticated(false);
      writeOperatorToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = readOperatorToken();
    if (!stored) {
      setReady(true);
      return;
    }
    setToken(stored);
    void loadShops(stored).finally(() => setReady(true));
  }, [loadShops]);

  if (!ready) return null;

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-16">
        <h1 className="font-heading text-2xl font-semibold text-zinc-100">ClipperQ Super Admin</h1>
        <p className="text-sm text-zinc-400">Platform operator</p>
        <input
          type="password"
          placeholder="Super Admin Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-100 outline-none"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => void loadShops(token)}
          disabled={loading || !token}
          className="min-h-12 w-full max-w-sm rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Shops Management</h1>
          <p className="text-sm text-zinc-400">Active shops: {shops.length}</p>
        </div>
        <Link
          href="/pilot"
          className="rounded-lg border border-amber-500/40 px-3 py-2 text-sm font-medium text-amber-400"
        >
          Pilot Test
        </Link>
      </header>

      <QuickAddShopForm token={token} onSuccess={() => void loadShops(token)} />

      <section data-testid="recommended-tiers">
        <h2 className="mb-3 text-xl font-semibold">
          แพ็กแนะนำตามจำนวนช่าง ({recommendedShops.length})
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          ระบบแจ้งในแอดมินร้านอัตโนมัติตั้งแต่วันที่ 25 ของทดลอง — ไม่ต้องทักเอง
        </p>
        {recommendedShops.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีร้าน</p>
        ) : (
          <ul className="space-y-2">
            {recommendedShops.map((shop) => {
              const seats = shop.seatBookableCount ?? 0;
              return (
                <li
                  key={shop.id}
                  data-testid="recommended-tier-row"
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3"
                >
                  <p className="text-sm font-semibold text-zinc-100">{shop.name}</p>
                  <p className="text-xs text-zinc-400">
                    จองได้ {seats} คน · แนะนำ{" "}
                    {shop.recommendedTierLabel ?? "—"}
                    {shop.recommendedPriceLabel
                      ? ` ${shop.recommendedPriceLabel}/เดือน`
                      : ""}
                    {shop.showBillingNotice ? " · แจ้งในแอดมินแล้ว" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section data-testid="cancel-feedback-list">
        <h2 className="mb-3 text-xl font-semibold">
          ความคิดเห็นไม่ใช้ต่อ ({cancelFeedback.length})
        </h2>
        {cancelFeedback.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีการส่งความคิดเห็น</p>
        ) : (
          <ul className="space-y-2">
            {cancelFeedback.map((row) => (
              <li
                key={row.id}
                data-testid="cancel-feedback-row"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {row.shopName}
                  <span className="ml-2 text-xs font-normal text-amber-300">
                    {row.reasonLabel}
                  </span>
                </p>
                {row.detail ? (
                  <p className="mt-1 text-xs text-zinc-300">{row.detail}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-zinc-500">
                  {new Date(row.created_at).toLocaleString("th-TH")}
                  {row.bookable_count != null
                    ? ` · จองได้ ${row.bookable_count} คน`
                    : ""}
                  {row.recommended_tier
                    ? ` · แนะนำ ${row.recommended_tier}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">LINE OA Install Requests</h2>
        <LineSupportInbox token={token} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shops List</h2>
        <div className="space-y-3">
          {shops.length === 0 ? (
            <p className="text-sm text-zinc-500">No shops yet</p>
          ) : (
            shops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                superAdminToken={token}
                onRegenerated={() => void loadShops(token)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
