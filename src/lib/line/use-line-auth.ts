"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { saveLiffReturnPath } from "@/lib/line/liff-return";

const REF_KEY = "barberq_customer_ref";

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
  liff.login({ redirectUri: window.location.origin });
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
    void liff
      .init({ liffId })
      .then(async () => {
        if (cancelled) return;
        setIsInClient(liff.isInClient());
        if (liff.isLoggedIn()) {
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
        startLiffLogin();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "LIFF init failed");
        setReady(true);
      });

    return () => {
      cancelled = true;
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
