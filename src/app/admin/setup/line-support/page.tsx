"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { getOptionalBarberqSupportLineUrl } from "@/lib/env";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import {
  LINE_OA_HELP_TYPES,
  RICH_MENU_STATES,
  shouldShowSuccessState,
  type LineOaHelpType,
  type LineOaInstallRequest,
  type LineOaInstallRequestStatus,
  type RichMenuState,
} from "@/lib/onboarding/line-oa-install";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

const RICH_MENU_LABELS: Record<RichMenuState, MessageKey> = {
  existing: "onboarding.lineSupportRichMenuExisting",
  none: "onboarding.lineSupportRichMenuNone",
  unsure: "onboarding.lineSupportRichMenuUnsure",
};

const HELP_TYPE_LABELS: Record<LineOaHelpType, MessageKey> = {
  add_to_existing: "onboarding.lineSupportHelpAddExisting",
  new_menu: "onboarding.lineSupportHelpNewMenu",
  recommend: "onboarding.lineSupportHelpRecommend",
};

const STATUS_LABELS: Record<LineOaInstallRequestStatus, MessageKey> = {
  NEW: "onboarding.lineSupportStatusNew",
  CONTACTED: "onboarding.lineSupportStatusContacted",
  IN_PROGRESS: "onboarding.lineSupportStatusInProgress",
  DONE: "onboarding.lineSupportStatusDone",
  CANCELLED: "onboarding.lineSupportStatusCancelled",
};

export default function LineSupportPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const supportLineUrl = getOptionalBarberqSupportLineUrl();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [request, setRequest] = useState<LineOaInstallRequest | null>(null);

  const [lineOa, setLineOa] = useState("");
  const [richMenuState, setRichMenuState] = useState<RichMenuState>("unsure");
  const [helpType, setHelpType] = useState<LineOaHelpType>("recommend");
  const [contactPhone, setContactPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [setupRes, settingsRes, supportRes] = await Promise.all([
        fetch(shopApi("/setup"), { headers: authHeaders }),
        fetch(shopApi("/settings"), { headers: authHeaders }),
        fetch(shopApi("/setup/line-support"), { headers: authHeaders }),
      ]);
      if (!setupRes.ok || !settingsRes.ok || !supportRes.ok) {
        throw new Error("Failed to load");
      }
      const setup = (await setupRes.json()) as { bookingUrl?: string };
      const settings = (await settingsRes.json()) as {
        shopName?: string | null;
        phone?: string | null;
      };
      const support = (await supportRes.json()) as {
        request?: LineOaInstallRequest | null;
      };
      setBookingUrl(setup.bookingUrl ?? "");
      setShopName(settings.shopName ?? "");
      setContactPhone(settings.phone ?? "");
      setRequest(support.request ?? null);
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, shopApi, t]);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    void load();
  }, [load, profile, ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/setup/line-support"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ lineOa, richMenuState, helpType, contactPhone }),
      });
      const json = (await res.json()) as {
        request?: LineOaInstallRequest;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed");
      }
      setRequest(json.request ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <section className="flex min-h-full items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (!profile || profile.role !== "owner") {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
        <Link href={shopPath("/admin")} className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  const showSuccess = shouldShowSuccessState(request);

  return (
    <AdminShell role={profile.role}>
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <AdminSessionBadge
          name={profile.displayName || profile.barberName}
          role={profile.role}
        />
        <Link href={shopPath("/admin/setup?step=link")} className="text-sm text-amber-400">
          ← {t("onboarding.lineSupportBack")}
        </Link>
        <h1 className="text-xl font-semibold">{t("onboarding.lineSupportTitle")}</h1>
        <p className="text-sm text-zinc-400">{t("onboarding.lineSupportHint")}</p>

        {loading ? (
          <p className="text-sm text-zinc-500">{t("common.loading")}</p>
        ) : showSuccess && request ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.lineSupportSuccessTitle")}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t("onboarding.lineSupportSuccessMessage")}
            </p>
            <span className="mt-4 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
              {t(STATUS_LABELS[request.status])}
            </span>
            {supportLineUrl ? (
              <a
                href={supportLineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200"
              >
                {t("onboarding.oaHelpCta")}
              </a>
            ) : null}
          </section>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportShopName")}</span>
              <input
                readOnly
                value={shopName}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportBookingUrl")}</span>
              <input
                readOnly
                value={bookingUrl}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportLineOa")}</span>
              <input
                required
                value={lineOa}
                onChange={(e) => setLineOa(e.target.value)}
                placeholder="@myshop"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportRichMenu")}</span>
              <select
                value={richMenuState}
                onChange={(e) => setRichMenuState(e.target.value as RichMenuState)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                {RICH_MENU_STATES.map((value) => (
                  <option key={value} value={value}>
                    {t(RICH_MENU_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportHelpType")}</span>
              <select
                value={helpType}
                onChange={(e) => setHelpType(e.target.value as LineOaHelpType)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                {LINE_OA_HELP_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(HELP_TYPE_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-400">{t("onboarding.lineSupportPhone")}</span>
              <input
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </label>
            <p className="text-xs text-zinc-500">{t("onboarding.oaHelpNoPassword")}</p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {submitting ? t("onboarding.saved") : t("onboarding.lineSupportSubmit")}
            </button>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
