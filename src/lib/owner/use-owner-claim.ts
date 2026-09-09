"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { saveLiffReturnPath } from "@/lib/line/liff-return";
import {
  clearOwnerInviteCode,
  OWNER_JOIN_PATH,
  prepareOwnerJoinForLiff,
  saveOwnerInviteCode,
} from "@/lib/owner/invite-session";
import {
  canStartOwnerLineLogin,
  LIFF_INIT_TIMEOUT_MS,
  type OwnerAuthPhase,
  resolveOwnerAuthPhaseAfterLiffInit,
  buildOwnerLiffLoginRedirectUri,
} from "@/lib/owner/owner-claim-state";

export interface OwnerClaimProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface UseOwnerClaimOptions {
  inviteCode: string | null;
}

let ownerLiffInit: Promise<void> | null = null;

function initOwnerLiff(liffId: string): Promise<void> {
  if (!ownerLiffInit) {
    ownerLiffInit = liff.init({ liffId });
  }
  return ownerLiffInit;
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

export function useOwnerClaim({ inviteCode }: UseOwnerClaimOptions) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [authPhase, setAuthPhase] = useState<OwnerAuthPhase>("initializing");
  const [profile, setProfile] = useState<OwnerClaimProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  const ready = authPhase !== "initializing";

  useEffect(() => {
    if (mockMode) {
      setProfile({ userId: MOCK_OWNER_LINE_ID, displayName: "Owner (Mock)" });
      setAuthPhase("authenticated");
      return;
    }

    prepareOwnerJoinForLiff();

    let cancelled = false;
    setAuthPhase("initializing");
    setProfile(null);

    void withTimeout(
      initOwnerLiff(liffId!),
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
        const nextPhase = resolveOwnerAuthPhaseAfterLiffInit({
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
      !canStartOwnerLineLogin({
        authPhase,
        inviteCode,
        mockMode,
      })
    ) {
      return;
    }
    saveOwnerInviteCode(inviteCode!);
    saveLiffReturnPath(OWNER_JOIN_PATH);
    const redirectUri = buildOwnerLiffLoginRedirectUri({
      pageOrigin: window.location.origin,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      inviteCode: inviteCode!,
    });
    liff.login({ redirectUri });
  }, [authPhase, inviteCode, mockMode]);

  const retryInit = useCallback(() => {
    ownerLiffInit = null;
    setError(null);
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
    try {
      const res = await withTimeout(
        fetch("/api/owner/claim", {
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
        setError(json.error?.code ?? json.error?.message ?? "Claim failed");
        if (res.status === 401) {
          setAuthPhase("needs_login");
          setProfile(null);
        }
        return null;
      }
      setClaimed(true);
      clearOwnerInviteCode();
      return json.shop?.slug ?? null;
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
    mockMode,
  };
}
