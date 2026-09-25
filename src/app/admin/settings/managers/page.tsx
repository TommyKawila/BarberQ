"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { MessageKey } from "@/lib/i18n/dictionary";
import type { PublicManagerInviteStatus } from "@/lib/manager/invite-status";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface PublicManager {
  id: string;
  displayName: string;
  createdAt: string;
  active: boolean;
}

interface PublicInvite {
  id: string;
  status: PublicManagerInviteStatus;
  expiresAt: string;
  createdAt: string;
}

const STATUS_KEY: Record<PublicManagerInviteStatus, MessageKey> = {
  pending: "admin.inviteStatus.pending",
  expired: "admin.inviteStatus.expired",
  consumed: "admin.inviteStatus.consumed",
  revoked: "admin.inviteStatus.revoked",
};

export default function AdminManagersPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [managers, setManagers] = useState<PublicManager[]>([]);
  const [invites, setInvites] = useState<PublicInvite[]>([]);
  const [freshUrls, setFreshUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(shopApi("/managers"), { headers: authHeaders });
      const json = (await res.json()) as {
        managers?: PublicManager[];
        invites?: PublicInvite[];
      } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.forbiddenOwnerOnly"));
        return;
      }
      setError(null);
      setManagers(json.managers ?? []);
      setInvites(json.invites ?? []);
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, shopApi, t]);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    void load();
  }, [load, profile, ready]);

  async function inviteManager() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/managers"), {
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
      if (json.invite?.id && json.inviteUrl) {
        setFreshUrls((current) => ({ ...current, [json.invite!.id]: json.inviteUrl! }));
      }
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(inviteId: string) {
    const url = freshUrls[inviteId];
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(inviteId);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  async function regenerate(inviteId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi(`/managers/invites/${inviteId}/regenerate`), {
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
      if (json.invite?.id && json.inviteUrl) {
        setFreshUrls((current) => ({ ...current, [json.invite!.id]: json.inviteUrl! }));
      }
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi(`/managers/invites/${inviteId}/cancel`), {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const json = (await res.json()) as ApiError;
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(managerId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi(`/managers/${managerId}/revoke`), {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const json = (await res.json()) as ApiError;
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setRevokeId(null);
      await load();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !profile) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (profile.role !== "owner") {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.managersTitle")}</h1>
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
        <Link href={shopPath("/admin/settings")} className="min-h-11 text-sm text-amber-400 underline">
          {t("admin.settings")}
        </Link>
      </section>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const activeManagers = managers.filter((m) => m.active);
  const revokedManagers = managers.filter((m) => !m.active);

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <header>
          {mockMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <Link href={shopPath("/admin/settings")} className="text-sm text-amber-400">
            ← {t("admin.settings")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t("admin.managersTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.managersHint")}</p>
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void inviteManager()}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("admin.inviteManager")}
        </button>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.managersTitle")}</h2>
          {loading ? (
            <p className="mt-3 text-sm text-zinc-400">{t("common.loading")}</p>
          ) : activeManagers.length === 0 && revokedManagers.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">{t("admin.managersEmpty")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {activeManagers.map((manager) => (
                <li key={manager.id} className="rounded-xl bg-zinc-950 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{manager.displayName}</p>
                      <p className="text-xs text-zinc-400">{t("admin.managerActive")}</p>
                    </div>
                    {revokeId === manager.id ? (
                      <div className="flex w-full flex-col gap-2">
                        <p className="text-sm font-medium">{t("admin.revokeManagerConfirmTitle")}</p>
                        <p className="text-xs text-zinc-400">{t("admin.revokeManagerConfirmBody")}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void revoke(manager.id)}
                            className="min-h-11 flex-1 rounded-lg bg-red-600/90 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {t("admin.revokeManager")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokeId(null)}
                            className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300"
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevokeId(manager.id)}
                        className="min-h-11 rounded-lg border border-red-800/60 px-3 text-sm text-red-300"
                      >
                        {t("admin.revokeManager")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {revokedManagers.map((manager) => (
                <li key={manager.id} className="rounded-xl bg-zinc-950 p-3">
                  <p className="font-medium">{manager.displayName}</p>
                  <p className="text-xs text-zinc-400">{t("admin.managerRevoked")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.invitesTitle")}</h2>
          {invites.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">{t("admin.managersEmpty")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {invites.map((invite) => (
                <li key={invite.id} className="rounded-xl bg-zinc-950 p-3">
                  <p className="text-sm font-medium">{t(STATUS_KEY[invite.status])}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t("admin.inviteExpires")}: {dateFmt.format(new Date(invite.expiresAt))}
                  </p>
                  {freshUrls[invite.id] ? (
                    <>
                      <p className="mt-2 text-xs text-amber-300">{t("admin.inviteLinkOnce")}</p>
                      <button
                        type="button"
                        onClick={() => void copyLink(invite.id)}
                        className="mt-2 min-h-11 w-full rounded-lg bg-zinc-800 text-sm text-zinc-100"
                      >
                        {copiedId === invite.id ? t("admin.inviteLinkCopied") : t("admin.copyInviteLink")}
                      </button>
                    </>
                  ) : null}
                  {invite.status === "pending" || invite.status === "expired" ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void regenerate(invite.id)}
                        className="min-h-11 rounded-lg border border-zinc-700 text-sm text-zinc-200 disabled:opacity-50"
                      >
                        {t("admin.regenerateInvite")}
                      </button>
                      {invite.status === "pending" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void cancelInvite(invite.id)}
                          className="min-h-11 rounded-lg border border-zinc-700 text-sm text-zinc-400 disabled:opacity-50"
                        >
                          {t("admin.cancelInvite")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
