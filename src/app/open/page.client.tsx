"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildChromeIntentUrl,
  buildIosChromeUrl,
  detectInAppBrowser,
  isAndroid,
  isIos,
} from "@/lib/browser/in-app-browser";
import { buildAbsoluteUrl, resolveOpenTarget } from "@/lib/browser/open-targets";
import { useI18n } from "@/lib/i18n/locale-provider";

export default function OpenPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const path = useMemo(() => resolveOpenTarget(to), [to]);
  const [targetUrl, setTargetUrl] = useState("");
  const [inApp, setInApp] = useState(true);
  const [appName, setAppName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [android, setAndroid] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const ua = navigator.userAgent;
      const detected = detectInAppBrowser(ua);
      const origin = window.location.origin;
      const absolute = buildAbsoluteUrl(origin, path);
      setTargetUrl(absolute);
      setAndroid(isAndroid(ua));
      setIos(isIos(ua));
      setAppName(detected.appName);
      setInApp(detected.inApp);
      if (!detected.inApp) {
        window.location.replace(absolute);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  async function copyLink() {
    if (!targetUrl) return;
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!inApp) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("open.redirecting")}</p>
      </section>
    );
  }

  const detectedMessage = appName
    ? `${t("open.detectedPrefix")} ${appName}`
    : t("open.detectedGeneric");

  return (
    <section className="flex flex-col gap-5 px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-amber-400">BarberQ</p>
        <h1 className="mt-1 text-xl font-bold">{t("open.title")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{detectedMessage}</p>
      </header>

      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
        <li>{t("open.stepMenu")}</li>
        <li>{t("open.stepBrowser")}</li>
        <li>{t("open.stepRetry")}</li>
      </ol>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs text-zinc-500">{t("open.linkLabel")}</p>
        <p className="mt-1 break-all text-sm text-amber-400">{targetUrl}</p>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mt-3 min-h-11 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          {copied ? t("open.copied") : t("open.copy")}
        </button>
      </div>

      {android ? (
        <a
          href={targetUrl ? buildChromeIntentUrl(targetUrl) : "#"}
          className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-200"
        >
          {t("open.openChrome")}
        </a>
      ) : null}

      {ios ? (
        <a
          href={targetUrl ? buildIosChromeUrl(targetUrl) : "#"}
          className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-200"
        >
          {t("open.openChromeIos")}
        </a>
      ) : null}

      <p className="text-center text-xs text-zinc-500">{t("open.fallbackHint")}</p>
    </section>
  );
}
