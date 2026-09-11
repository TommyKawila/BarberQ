"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LineSupportInbox } from "@/components/superadmin/LineSupportInbox";
import { QuickAddShopForm } from "@/components/superadmin/QuickAddShopForm";
import { ShopCard } from "@/components/superadmin/ShopCard";
import {
  readOperatorToken,
  writeOperatorToken,
} from "@/lib/superadmin/operator-session";
import type { Shop } from "@/types/booking";

export default function SuperAdminPage() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadShops = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/shops", {
        headers: { "x-superadmin-token": authToken },
      });
      const json = (await res.json()) as { shops?: Shop[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Invalid token");
      setShops(json.shops ?? []);
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
        <h1 className="text-2xl font-semibold">Super Admin</h1>
        <input
          type="password"
          placeholder="Super Admin Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => void loadShops(token)}
          disabled={loading || !token}
          className="min-h-12 w-full max-w-sm rounded-xl bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
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
