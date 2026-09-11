"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { TrialLeadsCrm } from "@/components/superadmin/trial-leads/TrialLeadsCrm";
import { TrialLeadsSkeleton } from "@/components/superadmin/trial-leads/TrialLeadsStates";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  readOperatorToken,
  writeOperatorToken,
} from "@/lib/superadmin/operator-session";

export default function TrialLeadsPage() {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const login = useCallback(async (authToken: string) => {
    setError(null);
    try {
      const res = await fetch("/api/superadmin/trial-leads", {
        headers: { "x-superadmin-token": authToken },
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Invalid token");
      }
      setIsAuthenticated(true);
      writeOperatorToken(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsAuthenticated(false);
      writeOperatorToken(null);
    }
  }, []);

  useEffect(() => {
    const stored = readOperatorToken();
    if (!stored) {
      setReady(true);
      return;
    }
    setToken(stored);
    void login(stored).finally(() => setReady(true));
  }, [login]);

  if (!ready) return null;

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">{t("superadmin.crm.loginTitle")}</h1>
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
          onClick={() => void login(token)}
          disabled={!token}
          className="min-h-12 w-full max-w-sm rounded-xl bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("superadmin.crm.login")}
        </button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<TrialLeadsSkeleton />}>
        <TrialLeadsCrm token={token} />
      </Suspense>
    </div>
  );
}
