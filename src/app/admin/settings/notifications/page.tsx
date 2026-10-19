"use client";

import Link from "next/link";
import { Bell, Check, ChevronRight, Send, Shield, Users } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { deviceLabelFromUa } from "@/lib/webpush/device-label";
import type { BarberWebpushScope, WebPushSubscriptionRow } from "@/lib/webpush/subscriptions";

type Perm = NotificationPermission | "unsupported" | "loading";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export default function NotificationsSettingsPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [perm, setPerm] = useState<Perm>("loading");
  const [showPreprompt, setShowPreprompt] = useState(false);
  const [subscription, setSubscription] = useState<WebPushSubscriptionRow | null>(null);
  const [barberScope, setBarberScope] = useState<BarberWebpushScope>("own");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleLabel = useMemo(() => {
    if (!profile) return "";
    if (profile.role === "owner") return t("admin.roleOwner");
    if (profile.role === "manager") return t("admin.roleManager");
    return t("admin.roleBarber");
  }, [profile, t]);

  const device =
    typeof navigator !== "undefined"
      ? deviceLabelFromUa(navigator.userAgent, navigator.maxTouchPoints ?? 0)
      : "";

  const refreshPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  const load = useCallback(async () => {
    refreshPermission();
    try {
      const [vapidRes, subRes] = await Promise.all([
        fetch(shopApi("/webpush/vapid-public-key"), { headers: authHeaders }),
        fetch(shopApi("/webpush/subscription"), { headers: authHeaders }),
      ]);
      if (vapidRes.ok) {
        const v = (await vapidRes.json()) as { configured?: boolean };
        setConfigured(Boolean(v.configured));
      }
      if (subRes.ok) {
        const s = (await subRes.json()) as {
          subscription?: WebPushSubscriptionRow | null;
          barberScope?: BarberWebpushScope;
        };
        setSubscription(s.subscription ?? null);
        setBarberScope(s.barberScope ?? "own");
        setEndpoint(s.subscription?.endpoint ?? null);
      }
    } catch {
      /* ignore */
    }
  }, [authHeaders, refreshPermission, shopApi]);

  useEffect(() => {
    if (ready && profile) void load();
  }, [ready, profile, load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function enablePush() {
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error(t("webpush.unsupported"));
      }
      const permission = await Notification.requestPermission();
      setPerm(permission);
      setShowPreprompt(false);
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const vapidRes = await fetch(shopApi("/webpush/vapid-public-key"), {
        headers: authHeaders,
      });
      const vapid = (await vapidRes.json()) as { publicKey?: string | null };
      if (!vapid.publicKey) throw new Error(t("webpush.notConfigured"));

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch(shopApi("/webpush/subscription"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
          deviceLabel: deviceLabelFromUa(
            navigator.userAgent,
            navigator.maxTouchPoints ?? 0,
          ),
        }),
      });
      if (!res.ok) throw new Error(t("admin.updateFailed"));
      const body = (await res.json()) as { subscription?: WebPushSubscriptionRow };
      setSubscription(body.subscription ?? null);
      setEndpoint(json.endpoint ?? null);
      setToast(t("webpush.enabled"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function patchPrefs(patch: { notifyNewBooking?: boolean; notifyCancel?: boolean }) {
    if (!endpoint) return;
    setBusy(true);
    try {
      const res = await fetch(shopApi("/webpush/subscription"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ endpoint, ...patch }),
      });
      if (!res.ok) throw new Error("fail");
      const json = (await res.json()) as { subscription?: WebPushSubscriptionRow };
      setSubscription(json.subscription ?? null);
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/webpush/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ endpoint }),
      });
      if (!res.ok) throw new Error(t("admin.updateFailed"));
      setToast(t("webpush.testSent"));
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !profile) {
    return <section className="px-4 py-10 text-sm text-zinc-400">{t("common.loading")}</section>;
  }

  if (showPreprompt) {
    return (
      <AdminShell role={profile.role}>
        <div className="flex flex-col items-center gap-5 px-4 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-4xl text-amber-400">
            🔔
          </div>
          <h1 className="text-xl font-semibold">{t("webpush.prepromptTitle")}</h1>
          <p className="max-w-sm text-sm text-zinc-400">{t("webpush.prepromptBody")}</p>
          <section className="w-full max-w-sm rounded-2xl bg-zinc-900 p-4 text-left">
            <p className="text-sm font-semibold text-amber-400">{t("webpush.nextStep")}</p>
            <p className="mt-1 text-sm text-zinc-100">{t("webpush.nextStepBody")}</p>
            <p className="mt-2 text-xs text-zinc-500">{t("webpush.iosNote")}</p>
          </section>
          <button
            type="button"
            disabled={busy}
            onClick={() => void enablePush()}
            className="min-h-12 w-full max-w-sm rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("webpush.enable")}
          </button>
          <button
            type="button"
            onClick={() => setShowPreprompt(false)}
            className="min-h-11 w-full max-w-sm rounded-xl border border-zinc-700 text-sm"
          >
            {t("webpush.later")}
          </button>
        </div>
      </AdminShell>
    );
  }

  const isOperator = isShopOperatorRole(profile.role);
  const newBookingOn = subscription?.notifyNewBooking ?? true;
  const cancelOn = subscription?.notifyCancel ?? true;
  const shopScopeLabel =
    barberScope === "all" ? t("webpush.scopeAll") : t("webpush.scopeOwn");
  const denied = perm === "denied";

  return (
    <AdminShell role={profile.role}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-5">
        <header>
          <Link href={shopPath("/admin/settings")} className="text-sm text-zinc-400">
            {"<"} {t("admin.settings")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{t("webpush.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {profile.displayName || profile.barberName} ({roleLabel}) · {device}
          </p>
        </header>

        {!configured ? (
          <p className="rounded-xl bg-zinc-900 p-3 text-sm text-amber-400">
            {t("webpush.notConfigured")}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Bell className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
            <span className="text-sm text-zinc-100">{t("webpush.status")}</span>
          </div>
          {denied ? (
            <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">
              {t("webpush.deniedChip")}
            </span>
          ) : perm === "granted" && subscription ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {t("webpush.allowed")}
            </span>
          ) : (
            <button
              type="button"
              disabled={busy || !configured}
              onClick={() => setShowPreprompt(true)}
              className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("webpush.enable")}
            </button>
          )}
        </div>

        {denied ? (
          <>
            <section className="rounded-2xl border border-amber-400/50 bg-zinc-900 p-4">
              <p className="font-semibold">{t("webpush.blockedTitle")}</p>
              <p className="mt-2 text-sm text-zinc-300">{t("webpush.blockedBody")}</p>
            </section>
            <section className="rounded-2xl bg-zinc-900 p-4">
              <p className="font-semibold">{t("webpush.chromeHelpTitle")}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
                <li>{t("webpush.chromeHelp1")}</li>
                <li>{t("webpush.chromeHelp2")}</li>
                <li>{t("webpush.chromeHelp3")}</li>
              </ol>
              <p className="mt-3 text-sm text-amber-400">{t("webpush.iosHelpLink")}</p>
            </section>
            <button
              type="button"
              onClick={() => {
                refreshPermission();
                void load();
              }}
              className="min-h-12 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100"
            >
              {t("webpush.checkAgain")}
            </button>
          </>
        ) : (
          <>
            {profile.role === "barber" ? (
              <section className="rounded-2xl border border-amber-400/40 bg-zinc-900 p-4">
                <p className="text-sm font-semibold text-zinc-100">
                  {t("webpush.shopScopeBanner").replace("{scope}", shopScopeLabel)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{t("webpush.shopScopeBannerBody")}</p>
              </section>
            ) : null}

            <section className="rounded-2xl bg-zinc-900 p-4">
              <h2 className="text-sm font-semibold">
                {barberScope === "all" && profile.role === "barber"
                  ? t("webpush.sectionAll")
                  : t("webpush.sectionMine")}
              </h2>
              <ToggleRow
                title={t("webpush.newBooking")}
                body={t("webpush.newBookingBody")}
                on={newBookingOn}
                disabled={!subscription || busy}
                onChange={(v) => void patchPrefs({ notifyNewBooking: v })}
              />
              <ToggleRow
                title={t("webpush.cancel")}
                body={t("webpush.cancelBody")}
                on={cancelOn}
                disabled={!subscription || busy}
                onChange={(v) => void patchPrefs({ notifyCancel: v })}
              />
            </section>

            {isOperator ? (
              <section className="rounded-2xl bg-zinc-900 p-4">
                <h2 className="text-sm font-semibold text-zinc-100">{t("webpush.sectionShopOwner")}</h2>
                <div className="mt-3 flex min-h-16 items-center justify-between gap-3 border-t border-zinc-800 pt-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100">{t("webpush.ownerAlwaysOnTitle")}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{t("webpush.ownerAlwaysAll")}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    {t("webpush.alwaysOn")}
                  </span>
                </div>
                <Link
                  href={shopPath("/admin/settings/notifications/barber-scope")}
                  className="mt-1 flex min-h-16 items-center justify-between gap-3 border-t border-zinc-800 text-sm text-zinc-100"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Users className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium">{t("webpush.configureBarberScope")}</span>
                      <span className="mt-0.5 block text-xs text-zinc-400 md:hidden">{shopScopeLabel}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs text-zinc-400 md:inline">{shopScopeLabel}</span>
                    <ChevronRight className="h-5 w-5 text-zinc-500" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </section>
            ) : null}

            <p className="text-xs text-[#b9b0a2]">{t("webpush.footerNote")}</p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="button"
              disabled={busy || !subscription}
              onClick={() => void sendTest()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100 disabled:opacity-40"
            >
              <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
              {t("webpush.sendTest")}
            </button>
          </>
        )}

        {toast ? (
          <p
            role="status"
            className="fixed inset-x-4 bottom-20 z-30 mx-auto max-w-sm rounded-xl border border-emerald-500/40 bg-zinc-900 px-4 py-3 text-sm text-emerald-300 shadow-lg"
          >
            ✓ {toast}
          </p>
        ) : null}
      </div>
    </AdminShell>
  );
}

function ToggleRow({
  title,
  body,
  on,
  disabled,
  onChange,
}: {
  title: string;
  body: string;
  on: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-describedby={descId}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="mt-3 flex min-h-16 w-full items-center justify-between gap-3 border-t border-zinc-800 pt-3 text-left disabled:opacity-40"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-100">{title}</span>
        <span id={descId} className="mt-0.5 block text-xs text-zinc-400">
          {body}
        </span>
      </span>
      <span
        aria-hidden
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition ${
          on ? "bg-amber-400" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            on ? "left-[22px]" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
