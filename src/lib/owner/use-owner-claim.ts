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

    prepareOwnerJoinForLiff();

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
    saveOwnerInviteCode(inviteCode);
    saveLiffReturnPath(OWNER_JOIN_PATH);
    liff.login({ redirectUri: window.location.origin });
  }, [inviteCode, mockMode, ready]);

  const claim = useCallback(async () => {
    if (!profile || !inviteCode || claiming || claimed) return null;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getLineAuthHeaders(mockMode ? profile.userId : undefined),
        },
        body: JSON.stringify({
          code: inviteCode,
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
      clearOwnerInviteCode();
      return json.shop?.slug ?? null;
    } catch {
      setError("Claim failed");
      return null;
    } finally {
      setClaiming(false);
    }
  }, [claiming, claimed, inviteCode, mockMode, profile]);

  return { ready, profile, login, claim, claiming, claimed, error, mockMode };
}
