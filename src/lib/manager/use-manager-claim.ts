"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { saveLiffReturnPath } from "@/lib/line/liff-return";
import {
  clearManagerInviteCode,
  MANAGER_JOIN_PATH,
  prepareManagerJoinForLiff,
  saveManagerInviteCode,
} from "@/lib/manager/invite-session";
import {
  canStartManagerLineLogin,
  LIFF_INIT_TIMEOUT_MS,
  type ManagerAuthPhase,
  resolveManagerAuthPhaseAfterLiffInit,
  buildManagerLiffLoginRedirectUri,
} from "@/lib/manager/manager-claim-state";

export interface ManagerClaimProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface UseManagerClaimOptions {
  inviteCode: string | null;
}

let managerLiffInit: Promise<void> | null = null;

function initManagerLiff(liffId: string): Promise<void> {
  if (!managerLiffInit) {
    managerLiffInit = liff.init({ liffId });
  }
  return managerLiffInit;
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

export function useManagerClaim({ inviteCode }: UseManagerClaimOptions) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [authPhase, setAuthPhase] = useState<ManagerAuthPhase>("initializing");
  const [profile, setProfile] = useState<ManagerClaimProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  const ready = authPhase !== "initializing";

  useEffect(() => {
    if (mockMode) {
      setProfile({ userId: "mock-manager-line-id", displayName: "Manager (Mock)" });
      setAuthPhase("authenticated");
      return;
    }

    prepareManagerJoinForLiff();

    let cancelled = false;
    setAuthPhase("initializing");
    setProfile(null);

    void withTimeout(
      initManagerLiff(liffId!),
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
        const nextPhase = resolveManagerAuthPhaseAfterLiffInit({
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
      !canStartManagerLineLogin({
        authPhase,
        inviteCode,
        mockMode,
      })
    ) {
      return;
    }
    saveManagerInviteCode(inviteCode!);
    saveLiffReturnPath(MANAGER_JOIN_PATH);
    const redirectUri = buildManagerLiffLoginRedirectUri({
      pageOrigin: window.location.origin,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      inviteCode: inviteCode!,
    });
    liff.login({ redirectUri });
  }, [authPhase, inviteCode, mockMode]);

  const retryInit = useCallback(() => {
    managerLiffInit = null;
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
        fetch("/api/manager/claim", {
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
        return { errorCode: code, slug: null };
      }
      setClaimed(true);
      clearManagerInviteCode();
      return { errorCode: null, slug: json.shop?.slug ?? null };
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
    error,
    errorCode,
    mockMode,
  };
}
