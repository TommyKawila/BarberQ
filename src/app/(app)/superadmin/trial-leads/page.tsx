"use client";

import Link from "next/link";
import { useState } from "react";
import { PlatformTopBar } from "@/components/layout/PlatformTopBar";
import { TrialLeadsInbox } from "@/components/superadmin/TrialLeadsInbox";

export default function TrialLeadsPage() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setError(null);
    try {
      const res = await fetch("/api/superadmin/trial-leads", {
        headers: { "x-superadmin-token": token },
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Invalid token");
      }
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsAuthenticated(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <PlatformTopBar />
        <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
          <h1 className="text-2xl font-semibold">Trial Leads</h1>
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
            onClick={() => void login()}
            disabled={!token}
            className="min-h-12 w-full max-w-sm rounded-xl bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
          >
            Login
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <PlatformTopBar />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Trial Leads</h1>
          <Link href="/superadmin" className="text-sm text-amber-400 underline">
            ← Shops
          </Link>
        </header>
        <TrialLeadsInbox token={token} />
      </div>
    </>
  );
}
