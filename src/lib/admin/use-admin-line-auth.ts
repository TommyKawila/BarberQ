"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import liff from "@line/liff";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { saveLiffReturnPath } from "@/lib/line/liff-return";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

export interface AdminProfile {
  lineId: string;
  displayName: string;
  pictureUrl?: string;
  role: "owner" | "barber";
  barberId: string;
  barberName: string;
  shopId: string | null;
}

export function useAdminLineAuth() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (lineId: string, displayName = "", pictureUrl?: string) => {
      const res = await fetch("/api/admin/auth", {
        headers: getLineAuthHeaders(mockMode ? lineId : undefined),
      });
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
    },
    [mockMode],
  );

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
    saveLiffReturnPath(window.location.pathname);
    liff.login({ redirectUri: window.location.origin });
  }, [mockMode, ready]);

  const authHeaders = useMemo(
    () => getLineAuthHeaders(mockMode ? profile?.lineId : profile?.lineId),
    [mockMode, profile?.lineId],
  );

  return { ready, profile, error, login, authHeaders, mockMode };
}

/** Redirects to shop login when LINE session is missing (non-mock). */
export function useAdminPageAuth() {
  const { shopPath } = useShopSlug();
  const auth = useAdminLineAuth();

  useEffect(() => {
    if (!auth.ready || auth.profile || auth.mockMode) return;
    window.location.href = shopPath("/admin/login");
  }, [auth.mockMode, auth.profile, auth.ready, shopPath]);

  return auth;
}
