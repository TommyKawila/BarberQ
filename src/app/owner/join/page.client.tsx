"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useOwnerClaim } from "@/lib/owner/use-owner-claim";
import { useI18n } from "@/lib/i18n/locale-provider";

interface InvitePreview {
  shopName: string;
  expired: boolean;
  claimed: boolean;
}

export default function OwnerJoinPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { ready, profile, login, claim, claiming, claimed, error, mockMode } = useOwnerClaim({
    inviteCode: code,
  });
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setPreviewError("INVITE_NOT_FOUND");
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    void fetch(`/api/owner/invite?code=${encodeURIComponent(code)}`)
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
  }, [code]);

  useEffect(() => {
    if (!ready || !profile || !preview || preview.expired || preview.claimed || claimed) return;
    void claim().then((slug) => {
      if (slug) router.replace(`/${slug}/admin/setup`);
    });
  }, [claim, claimed, preview, profile, ready, router]);

  if (loadingPreview || !ready) {
    return (
      <section className="flex min-h-full items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (!code || previewError || !preview) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-red-400">{t("owner.inviteInvalid")}</p>
      </section>
    );
  }

  if (preview.claimed) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-amber-400">{t("owner.inviteClaimed")}</p>
      </section>
    );
  }

  if (preview.expired) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-red-400">{t("owner.inviteExpired")}</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("owner.joinTitle")}</h1>
      <p className="text-center text-sm text-zinc-400">
        {t("owner.joinHint").replace("{name}", preview.shopName)}
      </p>
      {mockMode ? (
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-amber-400">
          {t("common.prototypeMode")}
        </span>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!profile ? (
        <button
          type="button"
          onClick={login}
          className="min-h-12 w-full max-w-sm rounded-xl bg-[#06C755] font-semibold text-white"
        >
          {t("booking.loginWithLine")}
        </button>
      ) : claiming ? (
        <p className="text-sm text-zinc-400">{t("owner.claiming")}</p>
      ) : claimed ? (
        <p className="text-sm text-emerald-400">{t("owner.claimSuccess")}</p>
      ) : null}
    </section>
  );
}
