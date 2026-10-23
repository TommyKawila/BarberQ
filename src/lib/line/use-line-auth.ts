"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import {
  buildLiffLoginRedirectUri,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";
import { canUseCustomerBookingSession } from "@/lib/line/line-auth-session";
import {
  __resetSharedLiffInitForTests,
  ensureLiffInit,
} from "@/lib/line/liff-init";

const REF_KEY = "barberq_customer_ref";

/** If LIFF in-client auto-login never returns, unblock the UI so users can tap login. */
export const LIFF_LOGIN_HANDOFF_TIMEOUT_MS = 8_000;

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

/** @internal tests — shared with admin via liff-init. */
export function __resetCustomerLiffInitForTests() {
  __resetSharedLiffInitForTests();
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

async function resolveCustomerSession(): Promise<
  | { ok: true; profile: LineProfile; isInClient: boolean }
  | { ok: false; isInClient: boolean; needsLoginHandoff: boolean }
> {
  const isInClient = liff.isInClient();
  const loggedIn = liff.isLoggedIn();
  const accessToken = readLiffAccessToken();
  if (
    canUseCustomerBookingSession({
      mockMode: false,
      loggedIn,
      accessToken,
    })
  ) {
    const p = await liff.getProfile();
    return {
      ok: true,
      isInClient,
      profile: {
        userId: p.userId,
        displayName: p.displayName,
        pictureUrl: p.pictureUrl,
      },
    };
  }
  // Flex / plain web: show login CTA. In-client: redirect handoff.
  return { ok: false, isInClient, needsLoginHandoff: isInClient };
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

    void (async () => {
      try {
        await ensureLiffInit(liffId);
        if (cancelled) return;
        const session = await resolveCustomerSession();
        if (cancelled) return;
        setIsInClient(session.isInClient);
        if (session.ok) {
          setProfile(session.profile);
          setReady(true);
          return;
        }
        if (!session.needsLoginHandoff) {
          setReady(true);
          return;
        }
        loginHandoffTimer = setTimeout(() => {
          if (cancelled) return;
          setReady(true);
        }, LIFF_LOGIN_HANDOFF_TIMEOUT_MS);
        startLiffLogin();
      } catch (err: unknown) {
        if (cancelled) return;
        // Re-init after remount often rejects "already initialized" — still try session.
        try {
          const session = await resolveCustomerSession();
          if (cancelled) return;
          setIsInClient(session.isInClient);
          if (session.ok) {
            setProfile(session.profile);
            setReady(true);
            return;
          }
          if (!session.needsLoginHandoff) {
            setReady(true);
            return;
          }
          loginHandoffTimer = setTimeout(() => {
            if (cancelled) return;
            setReady(true);
          }, LIFF_LOGIN_HANDOFF_TIMEOUT_MS);
          startLiffLogin();
          return;
        } catch {
          /* fall through to logged-out ready */
        }
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "LIFF init failed");
        setReady(true);
      }
    })();

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
