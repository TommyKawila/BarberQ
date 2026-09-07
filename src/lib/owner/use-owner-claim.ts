"use client";

import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";

const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

export interface OwnerClaimProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface UseOwnerClaimOptions {
  inviteCode: string | null;
}

export function useOwnerClaim({ inviteCode }: UseOwnerClaimOptions) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const mockMode = !liffId;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<OwnerClaimProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mockMode) {
      setProfile({ userId: MOCK_OWNER_LINE_ID, displayName: "Owner (Mock)" });
      setReady(true);
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
        const p = await liff.getProfile();
        setProfile({
          userId: p.userId,
          displayName: p.displayName,
          pictureUrl: p.pictureUrl,
        });
        setReady(true);
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
    if (!ready || mockMode || !inviteCode) return;
    const redirectUri = `${window.location.origin}/owner/join?code=${encodeURIComponent(inviteCode)}`;
    liff.login({ redirectUri });
  }, [inviteCode, mockMode, ready]);

  const claim = useCallback(async () => {
    if (!profile || !inviteCode || claiming || claimed) return null;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inviteCode,
          lineId: profile.userId,
          displayName: profile.displayName,
        }),
      });
      const json = (await res.json()) as {
        error?: { code?: string; message?: string };
        shop?: { slug?: string };
      };
      if (!res.ok) {
        setError(json.error?.code ?? json.error?.message ?? "Claim failed");
        return null;
      }
      setClaimed(true);
      return json.shop?.slug ?? null;
    } catch {
      setError("Claim failed");
      return null;
    } finally {
      setClaiming(false);
    }
  }, [claiming, claimed, inviteCode, profile]);

  return { ready, profile, login, claim, claiming, claimed, error, mockMode };
}
