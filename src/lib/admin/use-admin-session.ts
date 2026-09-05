"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_TOKEN_KEY } from "@/lib/admin-auth";
import { useBrowserStorage } from "@/lib/browser-storage";
import type { StaffRole } from "@/lib/data/types";

export interface AdminSession {
  staffId: string;
  name: string;
  role: StaffRole;
  barberId: string | null;
}

interface AdminMeta {
  prototypeMode: boolean;
  adminAuthRequired: boolean;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

function readTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const token = params.get("token")?.trim();
  if (!token) return null;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return token;
}

export function useAdminSession() {
  const [tokenInput, setTokenInput] = useState("");
  const [adminToken, setAdminToken] = useBrowserStorage(ADMIN_TOKEN_KEY);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [meta, setMeta] = useState<AdminMeta>({
    prototypeMode: true,
    adminAuthRequired: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = readTokenFromHash();
    if (fromHash) setAdminToken(fromHash);
  }, [setAdminToken]);

  const authHeaders = useMemo((): HeadersInit => {
    const headers: HeadersInit = {};
    if (adminToken) headers["x-admin-token"] = adminToken;
    return headers;
  }, [adminToken]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff/me", { headers: authHeaders });
    const json = (await res.json()) as { staff?: AdminSession } & AdminMeta & ApiError;
    setMeta({
      prototypeMode: json.prototypeMode ?? true,
      adminAuthRequired: json.adminAuthRequired ?? false,
    });

    if (!res.ok) {
      setSession(null);
      if (res.status === 401) setAdminToken(null);
      setError(json.error?.message ?? null);
      setLoading(false);
      return;
    }

    setError(null);
    setSession(json.staff ?? null);
    setLoading(false);
  }, [authHeaders, setAdminToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadSession();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  function unlock() {
    const next = tokenInput.trim();
    if (!next) return;
    setAdminToken(next);
  }

  function signOut() {
    setAdminToken(null);
    setSession(null);
  }

  const isSuperAdmin = session?.role === "super_admin";
  const needsUnlock = meta.adminAuthRequired && !adminToken;

  return {
    tokenInput,
    setTokenInput,
    adminToken,
    setAdminToken,
    session,
    meta,
    loading,
    error,
    setError,
    authHeaders,
    loadSession,
    unlock,
    signOut,
    isSuperAdmin,
    needsUnlock,
  };
}
