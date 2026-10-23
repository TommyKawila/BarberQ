"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import {
  buildLiffLoginRedirectUri,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";
import { canUseCustomerBookingSession } from "@/lib/line/line-auth-session";

const REF_KEY = "barberq_customer_ref";

/** If LIFF in-client auto-login never returns, unblock the UI so users can tap login. */
export const LIFF_LOGIN_HANDOFF_TIMEOUT_MS = 8_000;

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

function loadMockProfile(): LineProfile {
  try {
    const stored = window.localStorage.getItem(REF_KEY);
    const userId = stored ?? `mock-${crypto.randomUUID()}`;
    if (!stored) window.localStorage.setItem(REF_KEY, userId);
    return { userId, displayName: "" };
  } catch {
    return { userId: `mock-${crypto.randomUUID()}`, displayName: "" };
  }
}

function startLiffLogin() {
  saveLiffReturnPath(window.location.pathname);
  liff.login({ redirectUri: buildLiffLoginRedirectUri() });
}

function readLiffAccessToken(): string | null {
  try {
    return liff.getAccessToken() || null;
  } catch {
    return null;
  }
}

export function useLineAuth() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInClient, setIsInClient] = useState(false);

  useEffect(() => {
    if (mockMode) {
      setProfile(loadMockProfile());
      setReady(true);
      return;
    }

    let cancelled = false;
    let loginHandoffTimer: ReturnType<typeof setTimeout> | undefined;
    void liff
      .init({ liffId })
      .then(async () => {
        if (cancelled) return;
        setIsInClient(liff.isInClient());
        const loggedIn = liff.isLoggedIn();
        const accessToken = readLiffAccessToken();
        // Profile without access token (plain /{slug} in LINE browser) cannot
        // call booking APIs — show login instead of a doomed submit.
        if (
          canUseCustomerBookingSession({
            mockMode: false,
            loggedIn,
            accessToken,
          })
        ) {
          const p = await liff.getProfile();
          if (cancelled) return;
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
          });
          setReady(true);
          return;
        }
        // Flex / plain web opens LINE's in-app browser (not LIFF). Auto-login
        // there often never returns → permanent "กำลังโหลด…". Show login CTA.
        if (!liff.isInClient()) {
          setReady(true);
          return;
        }
        // In-client LIFF redirects for login; if the handoff stalls, unblock UI.
        loginHandoffTimer = setTimeout(() => {
          if (cancelled) return;
          setReady(true);
        }, LIFF_LOGIN_HANDOFF_TIMEOUT_MS);
        startLiffLogin();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "LIFF init failed");
        setReady(true);
      });

    return () => {
      cancelled = true;
      if (loginHandoffTimer) clearTimeout(loginHandoffTimer);
    };
  }, [liffId, mockMode]);

  const login = useCallback(() => {
    if (mockMode) return;
    startLiffLogin();
  }, [mockMode]);

  const logout = useCallback(() => {
    if (!ready || mockMode) return;
    liff.logout();
    setProfile(null);
  }, [ready, mockMode]);

  return { ready, profile, error, login, logout, isInClient, mockMode };
}
