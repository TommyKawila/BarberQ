"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useManagerClaim } from "@/lib/manager/use-manager-claim";
import {
  readStoredManagerInvite,
  resolveInviteCode,
  restoreManagerInviteUrl,
} from "@/lib/manager/invite-session";
import {
  shouldAutoClaimManager,
  shouldShowManagerLoginCta,
} from "@/lib/manager/manager-claim-state";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";

interface InvitePreview {
  shopName: string;
  shopSlug: string;
  expired: boolean;
  consumed: boolean;
  revoked: boolean;
}

function claimErrorKey(code: string | null): MessageKey {
  switch (code) {
    case "INVITE_EXPIRED":
      return "manager.inviteExpired";
    case "INVITE_ALREADY_CLAIMED":
      return "manager.inviteClaimed";
    case "INVITE_REVOKED":
      return "manager.inviteRevoked";
    case "MANAGER_ALREADY_ACTIVE":
      return "manager.alreadyActive";
    case "IDENTITY_INCOMPATIBLE":
      return "manager.identityDenied";
    case "INVITE_NOT_FOUND":
      return "manager.inviteInvalid";
    default:
      return "manager.inviteInvalid";
  }
}

export default function ManagerJoinPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const [inviteCode, setInviteCode] = useState<string | null>(() =>
    resolveInviteCode(search, null),
  );

  useEffect(() => {
    setInviteCode(resolveInviteCode(search, readStoredManagerInvite()));
  }, [search]);

  const {
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
  } = useManagerClaim({ inviteCode });
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const claimAttemptedRef = useRef(false);

  useEffect(() => {
    if (!inviteCode) {
      setPreviewError("INVITE_NOT_FOUND");
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    void fetch(`/api/manager/invite?code=${encodeURIComponent(inviteCode)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setPreviewError("INVITE_NOT_FOUND");
          return;
        }
        const json = (await res.json()) as { preview?: InvitePreview };
        setPreview(json.preview ?? null);
      })
      .catch(() => {
        if (!cancelled) setPreviewError("INVITE_NOT_FOUND");
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  useEffect(() => {
    if (!inviteCode || authPhase !== "authenticated" || !profile || !ready) return;
    restoreManagerInviteUrl(inviteCode);
  }, [authPhase, inviteCode, profile, ready]);

  useEffect(() => {
    const previewReady = Boolean(
      preview && !preview.expired && !preview.consumed && !preview.revoked,
    );
    const shouldClaim = shouldAutoClaimManager({
      authPhase,
      previewReady,
      claimed,
      claimAttempted: claimAttemptedRef.current,
    });
    if (!shouldClaim) return;
    claimAttemptedRef.current = true;
    void claim().then((result) => {
      if (result && "slug" in result && result.slug) {
        router.replace(`/${result.slug}/admin`);
      }
    });
  }, [authPhase, claim, claimed, preview, profile, ready, router]);

  if (loadingPreview || !ready) {
    return (
      <section className="flex min-h-full items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (!inviteCode || previewError || !preview) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-red-400">{t("manager.inviteInvalid")}</p>
      </section>
    );
  }

  if (preview.consumed) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-amber-400">{t("manager.inviteClaimed")}</p>
      </section>
    );
  }

  if (preview.revoked) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-red-400">{t("manager.inviteRevoked")}</p>
      </section>
    );
  }

  if (preview.expired) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-red-400">{t("manager.inviteExpired")}</p>
      </section>
    );
  }

  const showLogin = shouldShowManagerLoginCta({ authPhase, claiming });
  const alreadyActive = errorCode === "MANAGER_ALREADY_ACTIVE";

  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("manager.joinTitle")}</h1>
      <p className="text-center text-sm text-zinc-400">
        {t("manager.joinHint").replace("{name}", preview.shopName)}
      </p>
      {mockMode ? (
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-amber-400">
          {t("common.prototypeMode")}
        </span>
      ) : null}
      {error && !alreadyActive ? (
        <p className="text-sm text-red-400">{t(claimErrorKey(errorCode))}</p>
      ) : null}
      {alreadyActive ? (
        <>
          <p className="text-sm text-emerald-400">{t("manager.alreadyActive")}</p>
          {preview.shopSlug ? (
            <button
              type="button"
              onClick={() => router.replace(`/${preview.shopSlug}/admin`)}
              className="min-h-12 w-full max-w-sm rounded-xl bg-amber-400 font-semibold text-zinc-950"
            >
              {t("manager.continueAdmin")}
            </button>
          ) : null}
        </>
      ) : null}
      {authPhase === "init_failed" ? (
        <button
          type="button"
          onClick={retryInit}
          className="min-h-12 w-full max-w-sm rounded-xl border border-zinc-600 font-semibold text-zinc-200"
        >
          {t("manager.retry")}
        </button>
      ) : null}
      {showLogin ? (
        <button
          type="button"
          onClick={login}
          className="min-h-12 w-full max-w-sm rounded-xl bg-[#06C755] font-semibold text-white"
        >
          {t("booking.loginWithLine")}
        </button>
      ) : null}
      {authPhase === "authenticated" && profile && claiming ? (
        <p className="text-sm text-zinc-400">{t("manager.claiming")}</p>
      ) : null}
      {authPhase === "authenticated" && profile && claimed ? (
        <p className="text-sm text-emerald-400">{t("manager.claimSuccess")}</p>
      ) : null}
    </section>
  );
}
