"use client";

import { useCallback, useEffect, useState } from "react";
import { buildLineShareUrl } from "@/lib/barber/line-invite-url";
import type { PublicBarberLineInviteStatus } from "@/lib/barber/line-invite-status";
import { isValidLineUserId } from "@/lib/barber/line-user-id";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface PublicInvite {
  id: string;
  status: PublicBarberLineInviteStatus;
  expiresAt: string;
  createdAt: string;
}

interface BarberLineLinkCardProps {
  barber: Barber;
  authHeaders: HeadersInit;
  saving: boolean;
  onBarberUpdated: (barber: Barber) => void;
  /** Controlled LINE id for advanced manual save (parent persists on Save). */
  lineIdDraft: string;
  onLineIdDraftChange: (value: string) => void;
}

export function BarberLineLinkCard({
  barber,
  authHeaders,
  saving,
  onBarberUpdated,
  lineIdDraft,
  onLineIdDraftChange,
}: BarberLineLinkCardProps) {
  const { t, locale } = useI18n();
  const [pending, setPending] = useState<PublicInvite | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lineIdError, setLineIdError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/barbers/${barber.id}/line-invite`, {
        headers: authHeaders,
      });
      const json = (await res.json()) as { invite?: PublicInvite | null } & ApiError;
      if (!res.ok) return;
      setPending(json.invite ?? null);
    } catch {
      /* ignore */
    }
  }, [authHeaders, barber.id]);

  useEffect(() => {
    void loadPending();
  }, [loadPending, barber.line_id]);

  useEffect(() => {
    if (!freshUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const QR = await import("qrcode");
      const dataUrl = await QR.toDataURL(freshUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      if (!cancelled) setQrDataUrl(dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [freshUrl]);

  const effectiveStatus =
    barber.line_id?.trim()
      ? "linked"
      : pending?.status === "pending"
        ? "pending"
        : "unlinked";

  const dateFmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function createInvite() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/barbers/${barber.id}/line-invite`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as {
        invite?: PublicInvite;
        inviteUrl?: string;
      } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setPending(json.invite ?? null);
      setFreshUrl(json.inviteUrl ?? null);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barber.id}/line-invite`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ inviteId: pending.id }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setPending(null);
      setFreshUrl(null);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function unlinkLine() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ lineId: null }),
      });
      const json = (await res.json()) as { barber?: Barber } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      if (json.barber) onBarberUpdated(json.barber);
      onLineIdDraftChange("");
      setConfirmUnlink(false);
      setFreshUrl(null);
      setPending(null);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!freshUrl) return;
    try {
      await navigator.clipboard.writeText(freshUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("admin.updateFailed"));
    }
  }

  function onAdvancedLineChange(value: string) {
    onLineIdDraftChange(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setLineIdError(null);
      return;
    }
    setLineIdError(isValidLineUserId(trimmed) ? null : t("barberLine.invalidLineId"));
  }

  const statusLabel =
    effectiveStatus === "linked"
      ? barber.line_display_name?.trim()
        ? t("barberLine.statusLinkedNamed").replace(
            "{name}",
            barber.line_display_name.trim(),
          )
        : t("barberLine.statusLinked")
      : effectiveStatus === "pending"
        ? t("barberLine.statusPending").replace(
            "{time}",
            pending ? dateFmt.format(new Date(pending.expiresAt)) : "—",
          )
        : t("barberLine.statusUnlinked");

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-semibold">{t("admin.lineAdminSection")}</h2>
      <p className="mt-1 text-sm text-zinc-400">{t("admin.lineAdminHint")}</p>

      <p
        className={`mt-3 text-sm font-medium ${
          effectiveStatus === "linked"
            ? "text-emerald-400"
            : effectiveStatus === "pending"
              ? "text-amber-300"
              : "text-zinc-300"
        }`}
        data-testid="barber-line-status"
      >
        {statusLabel}
      </p>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

      {effectiveStatus !== "linked" ? (
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy || saving}
            onClick={() => void createInvite()}
            className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            data-testid="barber-line-send-link"
          >
            {t("barberLine.sendLink")}
          </button>

          {freshUrl ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
              <p className="break-all text-xs text-zinc-300" data-testid="barber-line-invite-url">
                {freshUrl}
              </p>
              <p className="mt-2 text-xs text-zinc-500">{t("admin.inviteLinkOnce")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="min-h-11 rounded-lg border border-zinc-600 px-3 text-sm text-zinc-100"
                >
                  {copied ? t("admin.inviteLinkCopied") : t("admin.copyInviteLink")}
                </button>
                <a
                  href={buildLineShareUrl(freshUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center rounded-lg bg-[#06C755] px-3 text-sm font-semibold text-white"
                >
                  {t("barberLine.shareLine")}
                </a>
              </div>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={t("barberLine.qrAlt")}
                  className="mx-auto mt-4 h-40 w-40 rounded-lg bg-white p-2"
                  data-testid="barber-line-qr"
                />
              ) : null}
            </div>
          ) : null}

          {effectiveStatus === "pending" && pending && !freshUrl ? (
            <p className="text-xs text-zinc-500">
              {t("admin.inviteExpires")}: {dateFmt.format(new Date(pending.expiresAt))}
            </p>
          ) : null}

          {pending ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void cancelInvite()}
              className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 disabled:opacity-50"
            >
              {t("barberLine.cancelInvite")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs text-zinc-500">{t("admin.unlinkLineWarning")}</p>
          {confirmUnlink ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || saving}
                onClick={() => void unlinkLine()}
                className="min-h-11 rounded-lg bg-red-600/90 px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("admin.unlinkLineConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmUnlink(false)}
                className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy || saving}
              onClick={() => setConfirmUnlink(true)}
              className="mt-3 min-h-11 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 disabled:opacity-50"
              data-testid="barber-line-unlink"
            >
              {t("admin.unlinkLine")}
            </button>
          )}
        </div>
      )}

      <details
        className="mt-5 border-t border-zinc-800 pt-3"
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-sm font-medium text-zinc-400">
          {t("barberLine.advanced")}
        </summary>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          {t("barberLine.manualLineId")}
          <input
            value={lineIdDraft}
            onChange={(e) => onAdvancedLineChange(e.target.value)}
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm"
            data-testid="barber-line-manual-id"
          />
        </label>
        {lineIdError ? (
          <p className="mt-1 text-xs text-red-400" data-testid="barber-line-manual-error">
            {lineIdError}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">{t("admin.barberLineHint")}</p>
        )}
      </details>
    </section>
  );
}

/** Exported for parent Save — validate advanced draft before PATCH. */
export function validateBarberLineIdDraft(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return isValidLineUserId(trimmed);
}
