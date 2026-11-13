"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import liff from "@line/liff";
import type { ShopStaffRole } from "@/lib/admin-auth";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { readQaE2eClientSession } from "@/lib/qa-e2e/client-session";
import {
  ADMIN_NO_SHOP_ACCESS_TH,
  thaiLiffAuthError,
} from "@/lib/line/liff-auth-errors";
import {
  readLiffSdkInClient,
  resolveLiffLoginInClient,
} from "@/lib/line/liff-in-client";
import { ensureLiffInit } from "@/lib/line/liff-init";
import { retryCustomerLiffLogin } from "@/lib/line/liff-login";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

export interface AdminProfile {
  lineId: string;
  displayName: string;
  pictureUrl?: string;
  role: "owner" | "barber" | "manager";
  barberId: string | null;
  barberName: string;
  shopId: string | null;
}

export function useAdminLineAuth() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qaE2eMode, setQaE2eMode] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  /** False when LIFF init failed — login then also checks LINE UA. */
  const [liffInitOk, setLiffInitOk] = useState(false);

  const loadProfile = useCallback(
    async (lineId: string, displayName = "", pictureUrl?: string) => {
      const res = await fetch("/api/admin/auth", {
        headers: getLineAuthHeaders(mockMode ? lineId : undefined),
      });
      if (!res.ok) {
        throw new Error(ADMIN_NO_SHOP_ACCESS_TH);
      }
      const data = (await res.json()) as {
        barberId: string | null;
        barberName: string;
        role: "owner" | "barber" | "manager";
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
    const qa = readQaE2eClientSession();
    if (qa?.token) {
      setQaE2eMode(true);
      void loadProfile(qa.lineUserId || "qa-e2e", "QA E2E")
        .catch((err: unknown) => {
          setError(thaiLiffAuthError(err));
        })
        .finally(() => setReady(true));
      return;
    }

    if (mockMode) {
      void loadProfile(MOCK_OWNER_LINE_ID, "Owner (Mock)")
        .catch((err: unknown) => {
          setError(thaiLiffAuthError(err));
        })
        .finally(() => setReady(true));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await ensureLiffInit(liffId);
        if (cancelled) return;
        setLiffInitOk(true);
        setIsInClient(
          resolveLiffLoginInClient({
            initOk: true,
            sdkInClient: readLiffSdkInClient(liff),
          }),
        );
        if (!liff.isLoggedIn()) {
          setReady(true);
          return;
        }
        const lineProfile = await liff.getProfile();
        await loadProfile(
          lineProfile.userId,
          lineProfile.displayName,
          lineProfile.pictureUrl,
        );
        if (!cancelled) setReady(true);
      } catch (err: unknown) {
        if (cancelled) return;
        // Init failed or remount race — prefer session if still readable.
        try {
          if (liff.isLoggedIn()) {
            const lineProfile = await liff.getProfile();
            if (cancelled) return;
            setLiffInitOk(true);
            setIsInClient(
              resolveLiffLoginInClient({
                initOk: true,
                sdkInClient: readLiffSdkInClient(liff),
              }),
            );
            await loadProfile(
              lineProfile.userId,
              lineProfile.displayName,
              lineProfile.pictureUrl,
            );
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          /* fall through — treat as init failure for login routing */
        }
        // Init never finished: use SDK isInClient if true, else LINE UA.
        setLiffInitOk(false);
        setIsInClient(
          resolveLiffLoginInClient({
            initOk: false,
            sdkInClient: readLiffSdkInClient(liff),
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : "",
          }),
        );
        if (cancelled) return;
        setError(thaiLiffAuthError(err));
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [liffId, loadProfile, mockMode]);

  const login = useCallback(() => {
    if (!ready || mockMode || qaE2eMode) return;
    setError(null);
    try {
      // Re-resolve at click time: init may have failed before isInClient was known.
      const inClient = resolveLiffLoginInClient({
        initOk: liffInitOk,
        sdkInClient: readLiffSdkInClient(liff),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
      // In LINE / init-fail: clear + reset + reload. Outside + init OK: path-aware OAuth.
      retryCustomerLiffLogin({ isInClient: inClient, initOk: liffInitOk });
    } catch (err: unknown) {
      setError(thaiLiffAuthError(err));
    }
  }, [mockMode, qaE2eMode, ready, liffInitOk]);

  const authHeaders = useMemo(
    () => getLineAuthHeaders(mockMode ? profile?.lineId : profile?.lineId),
    [mockMode, profile?.lineId],
  );

  return {
    ready,
    profile,
    error,
    login,
    authHeaders,
    mockMode: mockMode || qaE2eMode,
    isInClient,
  };
}

export type AdminAuthValue = ReturnType<typeof useAdminLineAuth>;

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

/** Single auth session for all admin pages — keeps nav mounted across route changes. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAdminLineAuth();
  return <AdminAuthContext.Provider value={auth}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}

/** Auth + redirect to login when session is missing (non-mock). */
export function useAdminPageAuth(): AdminAuthValue {
  const { shopPath } = useShopSlug();
  const auth = useAdminAuth();

  useEffect(() => {
    if (!auth.ready || auth.profile || auth.mockMode) return;
    window.location.href = shopPath("/admin/login");
  }, [auth.mockMode, auth.profile, auth.ready, shopPath]);

  return auth;
}

export function adminNavRole(profile: AdminProfile | null): ShopStaffRole {
  return profile?.role ?? "owner";
}
