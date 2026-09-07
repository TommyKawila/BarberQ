"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import liff from "@line/liff";

const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

export interface AdminProfile {
  lineId: string;
  displayName: string;
  pictureUrl?: string;
  role: "owner" | "barber";
  barberId: string;
  barberName: string;
  shopId: string | null;
}

function authHeadersFor(lineId: string | null): HeadersInit {
  const headers: HeadersInit = {};
  if (lineId) headers["x-admin-line-id"] = lineId;
  return headers;
}

export function useAdminLineAuth() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (lineId: string, displayName = "", pictureUrl?: string) => {
    const res = await fetch(`/api/admin/auth?lineId=${encodeURIComponent(lineId)}`);
    if (!res.ok) {
      throw new Error("Not authorized");
    }
    const data = (await res.json()) as {
      barberId: string;
      barberName: string;
      role: "owner" | "barber";
      shopId: string | null;
    };
    setProfile({
      lineId,
      displayName: displayName || data.barberName,
      pictureUrl,
      role: data.role,
      barberId: data.barberId,
      barberName: data.barberName,
      shopId: data.shopId,
    });
  }, []);

  useEffect(() => {
    if (mockMode) {
      void loadProfile(MOCK_OWNER_LINE_ID, "Owner (Mock)")
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Auth failed");
        })
        .finally(() => setReady(true));
      return;
    }

    let cancelled = false;
    void liff
      .init({ liffId })
      .then(async () => {
        if (cancelled) return;
        if (!liff.isLoggedIn()) {
          setReady(true);
          return;
        }
        const lineProfile = await liff.getProfile();
        await loadProfile(lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl);
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "LIFF init failed");
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [liffId, loadProfile, mockMode]);

  const login = useCallback(() => {
    if (!ready || mockMode) return;
    liff.login({ redirectUri: `${window.location.origin}/admin/login` });
  }, [mockMode, ready]);

  const authHeaders = useMemo(() => authHeadersFor(profile?.lineId ?? null), [profile?.lineId]);

  return { ready, profile, error, login, authHeaders, mockMode };
}
