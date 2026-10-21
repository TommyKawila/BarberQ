"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";
import type { ConnectionCheck, ConnectionTestResult } from "@/lib/line/connection-test";

type View = "checklist" | "keys" | "connected" | "error";

export default function LineConnectPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("checklist");
  const [channel, setChannel] = useState<ShopLineChannelPublic | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [channelId, setChannelId] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/line-channel"), { headers: authHeaders });
      if (!res.ok) throw new Error("load_failed");
      const json = (await res.json()) as {
        channel?: ShopLineChannelPublic | null;
        webhookUrl?: string;
        setupEmail?: string;
        shopId?: string;
      };
      setChannel(json.channel ?? null);
      setWebhookUrl(json.webhookUrl ?? "");
      setSetupEmail(json.setupEmail ?? "");
      setChannelId(json.channel?.messagingChannelId ?? "");
      if (json.channel?.status === "verified") setView("connected");
      else if (json.channel?.status === "broken") setView("error");
      else if (json.channel?.hasSecret) setView("keys");
      else setView("checklist");
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, shopApi, t]);

  useEffect(() => {
    if (ready && profile && isShopOperatorRole(profile.role)) void load();
  }, [ready, profile, load]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function saveKeys() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/line-channel"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          messagingChannelId: channelId,
          channelSecret: secret || undefined,
          accessToken: token || undefined,
          checklistStep: 4,
        }),
      });
      const json = (await res.json()) as { channel?: ShopLineChannelPublic; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "save_failed");
      setChannel(json.channel ?? null);
      setSecret("");
      setToken("");
      await runTest();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/line-channel/test"), {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as ConnectionTestResult;
      setTestResult(json);
      setChannel(json.channel);
      setView(json.ok ? "connected" : "error");
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setTesting(false);
    }
  }

  if (!ready || !profile) {
    return (
      <section className="px-4 py-10 text-sm text-zinc-400">{t("common.loading")}</section>
    );
  }
  if (!isShopOperatorRole(profile.role)) {
    return (
      <section className="flex flex-col gap-3 px-4 py-10">
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
        <Link href={shopPath("/admin")} className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  const doneThumbBar =
    view === "connected" ? (
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          disabled={testing}
          onClick={() => void runTest()}
          className="min-h-12 w-full rounded-xl border border-zinc-700 font-semibold text-zinc-100 disabled:opacity-50"
        >
          {t("lineConnect.testAgain")}
        </button>
        <Link
          href={shopPath("/admin/settings")}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          {t("lineConnect.done")}
        </Link>
      </div>
    ) : undefined;

  return (
    <AdminShell role={profile.role} thumbBar={doneThumbBar}>
      <div
        className={`flex flex-col gap-5 px-4 py-5${doneThumbBar ? " pb-28 lg:pb-4" : ""}`}
      >
        <header>
          <Link href={shopPath("/admin/settings")} className="text-sm text-zinc-400">
            ← {t("common.back")}
          </Link>
          <h1 className="mt-2 text-xl font-semibold">
            {view === "keys" || view === "error"
              ? t("lineConnect.keysTitle")
              : view === "connected"
                ? t("lineConnect.connectedTitle")
                : t("lineConnect.checklistTitle")}
          </h1>
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
          {view === "checklist" ? (
            <p className="mt-1 text-sm text-zinc-400">{t("lineConnect.checklistProgress")}</p>
          ) : null}
          {view === "keys" ? (
            <p className="mt-1 text-sm text-zinc-400">{t("lineConnect.keysHint")}</p>
          ) : null}
          {view === "connected" && channel?.botDisplayName ? (
            <p className="mt-1 text-sm text-zinc-400">
              {channel.oaBasicId ? `${channel.oaBasicId} · ` : ""}
              {channel.botDisplayName}
            </p>
          ) : null}
          {view === "error" ? (
            <p className="mt-1 text-sm text-zinc-400">{t("lineConnect.errorSubtitle")}</p>
          ) : null}
        </header>

        {loading ? <p className="text-sm text-zinc-400">{t("common.loading")}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {view === "checklist" ? (
          <ChecklistCard
            webhookUrl={webhookUrl}
            setupEmail={setupEmail}
            copied={copied}
            onCopy={copy}
            onManual={() => setView("keys")}
            t={t}
          />
        ) : null}

        {view === "keys" || view === "error" ? (
          <>
            {view === "error" && testResult ? (
              <ErrorCard result={testResult} t={t} />
            ) : null}
            <KeysForm
              channelId={channelId}
              secret={secret}
              token={token}
              secretLast4={channel?.channelSecretLast4}
              tokenLast4={channel?.accessTokenLast4}
              showSecret={showSecret}
              showToken={showToken}
              highlightSecret={testResult?.errorCode === "SIGNATURE_MISMATCH"}
              saving={saving || testing}
              onChannelId={setChannelId}
              onSecret={setSecret}
              onToken={setToken}
              onToggleSecret={() => setShowSecret((v) => !v)}
              onToggleToken={() => setShowToken((v) => !v)}
              onSubmit={() => void (secret || token || channelId ? saveKeys() : runTest())}
              t={t}
            />
            {view === "keys" ? (
              <button
                type="button"
                className="text-left text-sm text-amber-400"
                onClick={() => setView("checklist")}
              >
                ← {t("lineConnect.backToChecklist")}
              </button>
            ) : null}
          </>
        ) : null}

        {view === "connected" && channel ? (
          <ConnectedCard
            channel={channel}
            checks={testResult?.checks}
            quotaHref={shopPath("/admin/settings/line/quota")}
            t={t}
          />
        ) : null}

        <HelpCard t={t} />
      </div>
    </AdminShell>
  );
}

function ChecklistCard({
  webhookUrl,
  setupEmail,
  copied,
  onCopy,
  onManual,
  t,
}: {
  webhookUrl: string;
  setupEmail: string;
  copied: string | null;
  onCopy: (v: string, k: string) => void;
  onManual: () => void;
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
}) {
  return (
    <section className="rounded-2xl bg-zinc-900 p-4">
      <Step n={1} done title={t("lineConnect.step1Title")} body={t("lineConnect.step1Body")} />
      <Step
        n={2}
        active
        title={t("lineConnect.step2Title")}
        body={t("lineConnect.step2Body")}
        copyValue={webhookUrl}
        copyLabel={copied === "webhook" ? t("lineConnect.copied") : t("lineConnect.copy")}
        onCopy={() => onCopy(webhookUrl, "webhook")}
      />
      <Step n={3} title={t("lineConnect.step3Title")} body={t("lineConnect.step3Body")} />
      <Step
        n={4}
        title={t("lineConnect.step4Title")}
        body={t("lineConnect.step4Body")}
        copyValue={setupEmail}
        copyLabel={copied === "email" ? t("lineConnect.copied") : t("lineConnect.copy")}
        onCopy={() => onCopy(setupEmail, "email")}
      />
      <button type="button" onClick={onManual} className="mt-4 text-sm font-medium text-amber-400">
        {t("lineConnect.manualKeys")}
      </button>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  done,
  active,
  copyValue,
  copyLabel,
  onCopy,
}: {
  n: number;
  title: string;
  body: string;
  done?: boolean;
  active?: boolean;
  copyValue?: string;
  copyLabel?: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex gap-3 border-b border-zinc-800 py-3 last:border-0">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-amber-400 text-zinc-950"
              : "bg-zinc-700 text-zinc-200"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{body}</p>
        {copyValue ? (
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={copyValue}
              className="min-h-10 flex-1 truncate rounded-lg bg-zinc-950 px-3 text-xs text-zinc-300"
            />
            <button
              type="button"
              onClick={onCopy}
              className="min-h-10 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-zinc-950"
            >
              {copyLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KeysForm({
  channelId,
  secret,
  token,
  secretLast4,
  tokenLast4,
  showSecret,
  showToken,
  highlightSecret,
  saving,
  onChannelId,
  onSecret,
  onToken,
  onToggleSecret,
  onToggleToken,
  onSubmit,
  t,
}: {
  channelId: string;
  secret: string;
  token: string;
  secretLast4?: string | null;
  tokenLast4?: string | null;
  showSecret: boolean;
  showToken: boolean;
  highlightSecret?: boolean;
  saving: boolean;
  onChannelId: (v: string) => void;
  onSecret: (v: string) => void;
  onToken: (v: string) => void;
  onToggleSecret: () => void;
  onToggleToken: () => void;
  onSubmit: () => void;
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
}) {
  return (
    <section className="rounded-2xl bg-zinc-900 p-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Channel ID
        <input
          value={channelId}
          onChange={(e) => onChannelId(e.target.value)}
          className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
        />
      </label>
      <label className="mt-3 flex flex-col gap-1 text-sm text-zinc-300">
        Channel Secret
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={secret}
            placeholder={secretLast4 ? `•••••••••••• ${secretLast4}` : ""}
            onChange={(e) => onSecret(e.target.value)}
            className={`min-h-11 w-full rounded-lg bg-zinc-800 px-3 pr-12 text-base outline-none ring-amber-400 focus:ring-2 ${
              highlightSecret ? "ring-2 ring-orange-400" : ""
            }`}
          />
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
          >
            {showSecret ? "🙈" : "👁"}
          </button>
        </div>
      </label>
      <label className="mt-3 flex flex-col gap-1 text-sm text-zinc-300">
        Channel access token (long-lived)
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            placeholder={tokenLast4 ? `•••••••••••• ${tokenLast4}` : ""}
            onChange={(e) => onToken(e.target.value)}
            className="min-h-11 w-full rounded-lg bg-zinc-800 px-3 pr-12 text-base outline-none ring-amber-400 focus:ring-2"
          />
          <button
            type="button"
            onClick={onToggleToken}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
          >
            {showToken ? "🙈" : "👁"}
          </button>
        </div>
      </label>
      <p className="mt-2 text-xs text-zinc-500">{t("lineConnect.encryptedNote")}</p>
      <button
        type="button"
        disabled={saving}
        onClick={onSubmit}
        className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
      >
        {t("lineConnect.testConnection")}
      </button>
      <p className="mt-2 text-xs text-zinc-500">{t("lineConnect.testWillCheck")}</p>
    </section>
  );
}

function ErrorCard({
  result,
  t,
}: {
  result: ConnectionTestResult;
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
}) {
  return (
    <section className="rounded-2xl border border-orange-500/60 bg-zinc-900 p-4">
      <p className="text-base font-semibold text-zinc-50">{t("lineConnect.errorTitle")}</p>
      <p className="mt-1 text-sm text-zinc-300">{result.errorMessage}</p>
      {result.fixHintKey ? (
        <p className="mt-2 text-sm text-amber-400">{t(result.fixHintKey as never)}</p>
      ) : null}
      {result.errorCode ? (
        <p className="mt-2 text-xs text-zinc-500">
          {t("lineConnect.errorCode")}: {result.errorCode}
        </p>
      ) : null}
      <ul className="mt-3 space-y-1 text-sm">
        {result.checks
          .filter((c) => ["channel_id", "channel_secret", "access_token"].includes(c.id))
          .map((c) => (
            <li key={c.id} className={c.ok ? "text-emerald-400" : "text-orange-400"}>
              {c.ok ? "✓" : "✗"} {checkLabel(c, t)}
            </li>
          ))}
      </ul>
    </section>
  );
}

function ConnectedCard({
  channel,
  checks,
  quotaHref,
  t,
}: {
  channel: ShopLineChannelPublic;
  checks?: ConnectionCheck[];
  quotaHref: string;
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string;
}) {
  const list =
    checks ??
    ([
      { id: "channel_id", ok: true, labelKey: "" },
      { id: "webhook", ok: true, labelKey: "" },
      { id: "auto_reply", ok: true, labelKey: "" },
      { id: "test_message", ok: true, labelKey: "" },
      { id: "liff_rich_menu", ok: true, labelKey: "" },
    ] as ConnectionCheck[]);
  return (
    <>
      <section className="rounded-2xl border border-emerald-500/50 bg-zinc-900 p-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
          ✓
        </div>
        <p className="mt-3 text-lg font-semibold">{t("lineConnect.connected")}</p>
        {channel.lastVerifiedAt ? (
          <p className="mt-1 text-xs text-zinc-400">
            {t("lineConnect.lastTested")}: {new Date(channel.lastVerifiedAt).toLocaleString()}
          </p>
        ) : null}
        <ul className="mt-4 space-y-1 text-left text-sm text-emerald-400">
          {list.map((c) => (
            <li key={c.id}>
              ✓ {checkLabel(c, t, channel.botDisplayName)}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-zinc-900 p-4 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-zinc-400">{t("lineConnect.planLabel")}</span>
          <span>{t("lineConnect.planFree")}</span>
        </div>
        <div className="mt-2 flex justify-between gap-2">
          <span className="text-zinc-400">Channel ID</span>
          <span>{channel.messagingChannelId ?? "—"}</span>
        </div>
        <Link href={quotaHref} className="mt-3 inline-block text-sm text-amber-400">
          {t("lineConnect.viewQuota")} →
        </Link>
      </section>
    </>
  );
}

function HelpCard({ t }: { t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string }) {
  return (
    <section className="rounded-2xl bg-zinc-900/80 p-4">
      <p className="text-sm font-semibold text-zinc-100">{t("lineConnect.helpTitle")}</p>
      <p className="mt-1 text-xs text-zinc-400">{t("lineConnect.helpBody")}</p>
    </section>
  );
}

function checkLabel(
  c: ConnectionCheck,
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string,
  sender?: string | null,
) {
  switch (c.id) {
    case "channel_id":
      return sender
        ? t("lineConnect.check.keysOk").replace("{name}", sender)
        : t("lineConnect.check.channelId");
    case "channel_secret":
      return c.ok ? t("lineConnect.check.channelSecret") : t("lineConnect.check.secretBad");
    case "access_token":
      return t("lineConnect.check.accessToken");
    case "webhook":
      return t("lineConnect.check.webhook");
    case "auto_reply":
      return t("lineConnect.check.autoReply");
    case "test_message":
      return t("lineConnect.check.testMessage");
    case "liff_rich_menu":
      return t("lineConnect.check.liffRichMenu");
    default:
      return c.id;
  }
}
