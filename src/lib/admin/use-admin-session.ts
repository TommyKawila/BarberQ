"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_TOKEN_KEY } from "@/lib/admin-auth";
import { readLoginTokenFromUrl } from "@/lib/admin/read-login-token";
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

function authHeadersFor(token: string | null): HeadersInit {
  const headers: HeadersInit = {};
  if (token) headers["x-admin-token"] = token;
  return headers;
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
  const [tokenReady, setTokenReady] = useState(false);
  const bootstrappedRef = useRef(false);

  const authHeaders = useMemo(() => authHeadersFor(adminToken), [adminToken]);

  const loadSession = useCallback(
    async (tokenOverride?: string | null) => {
      const token = tokenOverride ?? adminToken;
      setLoading(true);
      try {
        const res = await fetch("/api/staff/me", { headers: authHeadersFor(token) });
        const json = (await res.json()) as { staff?: AdminSession } & AdminMeta & ApiError;
        setMeta({
          prototypeMode: json.prototypeMode ?? true,
          adminAuthRequired: json.adminAuthRequired ?? false,
        });

        if (!res.ok) {
          setSession(null);
          if (res.status === 401 && token) setAdminToken(null);
          setError(json.error?.message ?? null);
          setLoading(false);
          return;
        }

        setError(null);
        setSession(json.staff ?? null);
      } catch {
        setSession(null);
        setError("Connection failed");
      } finally {
        setLoading(false);
      }
    },
    [adminToken, setAdminToken],
  );

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const fromUrl = readLoginTokenFromUrl();
    if (fromUrl) setAdminToken(fromUrl);
    setTokenReady(true);
    void loadSession(fromUrl);
  }, [loadSession, setAdminToken]);

  function unlock() {
    const next = tokenInput.trim();
    if (!next) return;
    setAdminToken(next);
    void loadSession(next);
  }

  function signOut() {
    setAdminToken(null);
    setSession(null);
  }

  const isSuperAdmin = session?.role === "super_admin";
  const needsUnlock = tokenReady && meta.adminAuthRequired && !adminToken && !session;

  return {
    tokenInput,
    setTokenInput,
    adminToken,
    setAdminToken,
    session,
    meta,
    loading: loading || !tokenReady,
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
