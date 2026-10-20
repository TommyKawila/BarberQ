"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBarberLineClaim } from "@/lib/barber/use-barber-line-claim";
import {
  readStoredBarberLineInvite,
  resolveInviteCode,
  restoreBarberLineInviteUrl,
} from "@/lib/barber/line-invite-session";
import {
  shouldAutoClaimBarberLine,
  shouldShowBarberLineLoginCta,
} from "@/lib/barber/barber-line-claim-state";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";

interface InvitePreview {
  shopName: string;
  shopSlug: string;
  barberName: string;
  expired: boolean;
  consumed: boolean;
  revoked: boolean;
}

function claimErrorKey(code: string | null): MessageKey {
  switch (code) {
    case "INVITE_EXPIRED":
      return "barberLine.inviteExpired";
    case "INVITE_ALREADY_CLAIMED":
      return "barberLine.inviteClaimed";
    case "INVITE_REVOKED":
      return "barberLine.inviteRevoked";
    case "LINE_ID_TAKEN":
      return "barberLine.lineTaken";
    case "IDENTITY_INCOMPATIBLE":
      return "barberLine.identityDenied";
    case "BARBER_NOT_FOUND":
      return "barberLine.barberNotFound";
    case "INVITE_NOT_FOUND":
      return "barberLine.inviteInvalid";
    default:
      return "barberLine.inviteInvalid";
  }
}

export default function BarberLineJoinPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const [inviteCode, setInviteCode] = useState<string | null>(() =>
    resolveInviteCode(search, null),
  );

  useEffect(() => {
    setInviteCode(resolveInviteCode(search, readStoredBarberLineInvite()));
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
    claimedBarberName,
    error,
    errorCode,
    mockMode,
  } = useBarberLineClaim({ inviteCode });
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
    void fetch(`/api/barber-line-invite?code=${encodeURIComponent(inviteCode)}`)
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
    restoreBarberLineInviteUrl(inviteCode);
  }, [authPhase, inviteCode, profile, ready]);

  useEffect(() => {
    const previewReady = Boolean(
      preview && !preview.expired && !preview.consumed && !preview.revoked,
    );
    const shouldClaim = shouldAutoClaimBarberLine({
      authPhase,
      previewReady,
      claimed,
      claimAttempted: claimAttemptedRef.current,
    });
    if (!shouldClaim) return;
    claimAttemptedRef.current = true;
    void claim();
  }, [authPhase, claim, claimed, preview, profile, ready]);

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
        <p className="text-center text-sm text-red-400">{t("barberLine.inviteInvalid")}</p>
      </section>
    );
  }

  if (preview.consumed && !claimed) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-center text-sm text-amber-400">{t("barberLine.inviteClaimed")}</p>
      </section>
    );
  }

  if (preview.revoked) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-center text-sm text-red-400">{t("barberLine.inviteRevoked")}</p>
      </section>
    );
  }

  if (preview.expired) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-center text-sm text-red-400">{t("barberLine.inviteExpired")}</p>
      </section>
    );
  }

  if (claimed) {
    const name = claimedBarberName || preview.barberName;
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-center text-lg font-semibold text-emerald-400">
          {t("barberLine.claimSuccess").replace("{name}", name || "—")}
        </p>
        <p className="text-center text-sm text-zinc-400">{t("barberLine.claimSuccessHint")}</p>
      </section>
    );
  }

  const showLogin = shouldShowBarberLineLoginCta({ authPhase, claiming });

  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("barberLine.joinTitle")}</h1>
      <p className="text-center text-sm text-zinc-400">
        {t("barberLine.joinHint")
          .replace("{barber}", preview.barberName)
          .replace("{shop}", preview.shopName)}
      </p>
      {mockMode ? (
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-amber-400">
          {t("common.prototypeMode")}
        </span>
      ) : null}
      {error ? (
        <p className="text-center text-sm text-red-400">{t(claimErrorKey(errorCode))}</p>
      ) : null}
      {authPhase === "init_failed" ? (
        <button
          type="button"
          onClick={retryInit}
          className="min-h-12 w-full max-w-sm rounded-xl border border-zinc-600 font-semibold text-zinc-200"
        >
          {t("barberLine.retry")}
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
        <p className="text-sm text-zinc-400">{t("barberLine.claiming")}</p>
      ) : null}
    </section>
  );
}
