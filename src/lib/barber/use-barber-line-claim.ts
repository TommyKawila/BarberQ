"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { saveLiffReturnPath } from "@/lib/line/liff-return";
import {
  BARBER_LINE_JOIN_PATH,
  clearBarberLineInviteCode,
  prepareBarberLineJoinForLiff,
  saveBarberLineInviteCode,
} from "@/lib/barber/line-invite-session";
import {
  buildBarberLineLiffLoginRedirectUri,
  canStartBarberLineLogin,
  LIFF_INIT_TIMEOUT_MS,
  resolveBarberLineAuthPhaseAfterLiffInit,
  type BarberLineAuthPhase,
} from "@/lib/barber/barber-line-claim-state";

export interface BarberLineClaimProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface UseBarberLineClaimOptions {
  inviteCode: string | null;
}

let barberLineLiffInit: Promise<void> | null = null;

function initBarberLineLiff(liffId: string): Promise<void> {
  if (!barberLineLiffInit) {
    barberLineLiffInit = liff.init({ liffId });
  }
  return barberLineLiffInit;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function useBarberLineClaim({ inviteCode }: UseBarberLineClaimOptions) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [authPhase, setAuthPhase] = useState<BarberLineAuthPhase>("initializing");
  const [profile, setProfile] = useState<BarberLineClaimProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);
  const [claimedBarberName, setClaimedBarberName] = useState<string | null>(null);

  const ready = authPhase !== "initializing";

  useEffect(() => {
    if (mockMode) {
      setProfile({ userId: "mock-barber-line-id", displayName: "Barber (Mock)" });
      setAuthPhase("authenticated");
      return;
    }

    prepareBarberLineJoinForLiff();

    let cancelled = false;
    setAuthPhase("initializing");
    setProfile(null);

    void withTimeout(
      initBarberLineLiff(liffId!),
      LIFF_INIT_TIMEOUT_MS,
      "LIFF init timeout",
    )
      .then(async () => {
        if (cancelled) return;
        const isLoggedIn = liff.isLoggedIn();
        let accessToken: string | null = null;
        try {
          accessToken = isLoggedIn ? liff.getAccessToken() : null;
        } catch {
          accessToken = null;
        }
        const nextPhase = resolveBarberLineAuthPhaseAfterLiffInit({
          isLoggedIn,
          accessToken,
        });
        if (nextPhase === "needs_login") {
          setProfile(null);
          setAuthPhase("needs_login");
          return;
        }
        const p = await liff.getProfile();
        if (cancelled) return;
        setProfile({
          userId: p.userId,
          displayName: p.displayName,
          pictureUrl: p.pictureUrl,
        });
        setAuthPhase("authenticated");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "LIFF init failed";
        setError(message);
        setProfile(null);
        setAuthPhase("init_failed");
      });

    return () => {
      cancelled = true;
    };
  }, [initAttempt, liffId, mockMode]);

  const login = useCallback(() => {
    if (
      !canStartBarberLineLogin({
        authPhase,
        inviteCode,
        mockMode,
      })
    ) {
      return;
    }
    saveBarberLineInviteCode(inviteCode!);
    saveLiffReturnPath(BARBER_LINE_JOIN_PATH);
    const redirectUri = buildBarberLineLiffLoginRedirectUri({
      pageOrigin: window.location.origin,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      inviteCode: inviteCode!,
    });
    liff.login({ redirectUri });
  }, [authPhase, inviteCode, mockMode]);

  const retryInit = useCallback(() => {
    barberLineLiffInit = null;
    setError(null);
    setErrorCode(null);
    setInitAttempt((n) => n + 1);
  }, []);

  const claim = useCallback(async () => {
    if (!profile || !inviteCode || claiming || claimed || authPhase !== "authenticated") {
      return null;
    }
    const headers = getLineAuthHeaders(mockMode ? profile.userId : undefined);
    if (!mockMode && !("Authorization" in headers)) {
      setError("Missing LINE session");
      setAuthPhase("needs_login");
      setProfile(null);
      return null;
    }

    setClaiming(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await withTimeout(
        fetch("/api/barber-line-invite/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            code: inviteCode,
            displayName: profile.displayName,
          }),
        }),
        LIFF_INIT_TIMEOUT_MS,
        "Claim request timeout",
      );
      const json = (await res.json()) as {
        error?: { code?: string; message?: string };
        barber?: { name?: string };
        shop?: { slug?: string };
      };
      if (!res.ok) {
        const code = json.error?.code ?? json.error?.message ?? "Claim failed";
        setErrorCode(code);
        setError(code);
        if (res.status === 401) {
          setAuthPhase("needs_login");
          setProfile(null);
        }
        return { errorCode: code, slug: null, barberName: null };
      }
      setClaimed(true);
      setClaimedBarberName(json.barber?.name ?? null);
      clearBarberLineInviteCode();
      return {
        errorCode: null,
        slug: json.shop?.slug ?? null,
        barberName: json.barber?.name ?? null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Claim failed";
      setError(message);
      return null;
    } finally {
      setClaiming(false);
    }
  }, [authPhase, claiming, claimed, inviteCode, mockMode, profile]);

  return {
    ready,
    authPhase,
    profile,
    login,
    retryInit,
    claim,
    claiming,
    claimed,
    claimedBarberName,
    error,
    errorCode,
    mockMode,
  };
}
