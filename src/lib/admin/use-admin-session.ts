"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import liff from "@line/liff";
import { ADMIN_TOKEN_KEY } from "@/lib/admin-auth";
import { readLoginTokenFromUrl } from "@/lib/admin/read-login-token";
import { useBrowserStorage } from "@/lib/browser-storage";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import type { ShopStaffRole } from "@/lib/admin-auth";

export interface AdminSession {
  staffId: string;
  name: string;
  role: ShopStaffRole;
  barberId: string | null;
  shopId?: string;
}

interface AdminMeta {
  prototypeMode: boolean;
  adminAuthRequired: boolean;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

function authHeadersFor(token: string | null, lineUserId?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  const lineHeaders = getLineAuthHeaders(lineUserId);
  if (lineHeaders instanceof Headers) {
    lineHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(lineHeaders)) {
    for (const [key, value] of lineHeaders) headers[key] = value;
  } else {
    Object.assign(headers, lineHeaders);
  }
  if (token) headers["x-admin-token"] = token;
  return headers;
}

export function useAdminSession() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const [tokenInput, setTokenInput] = useState("");
  const [adminToken, setAdminToken] = useBrowserStorage(ADMIN_TOKEN_KEY);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [meta, setMeta] = useState<AdminMeta>({
    prototypeMode: true,
    adminAuthRequired: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!liffId) return;
    let cancelled = false;
    void liff
      .init({ liffId })
      .then(async () => {
        if (cancelled || !liff.isLoggedIn()) return;
        const p = await liff.getProfile();
        if (!cancelled) setLineUserId(p.userId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [liffId]);

  const authHeaders = useMemo(
    () => authHeadersFor(adminToken, lineUserId),
    [adminToken, lineUserId],
  );

  const loadSession = useCallback(
    async (tokenOverride?: string | null) => {
      const token = tokenOverride ?? adminToken;
      setLoading(true);
      try {
        const res = await fetch("/api/staff/me", {
          headers: authHeadersFor(token, lineUserId),
        });
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
    [adminToken, lineUserId, setAdminToken],
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

  const isOwner = session?.role === "owner";
  const needsUnlock = tokenReady && meta.adminAuthRequired && !adminToken && !session && !lineUserId;

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
    isOwner,
    isSuperAdmin: isOwner,
    needsUnlock,
  };
}
