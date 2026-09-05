"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useI18n } from "@/lib/i18n/locale-provider";
import { FitLogoError, fitLogoFile } from "@/lib/image/fit-logo";

const ADMIN_KEY = "barberq_admin_key";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface AdminMeta {
  prototypeMode: boolean;
  adminKeyRequired: boolean;
}

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const { logoDataUrl, setLogoDataUrl, refresh } = useShopBrand();
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useBrowserStorage(ADMIN_KEY);
  const [meta, setMeta] = useState<AdminMeta>({
    prototypeMode: true,
    adminKeyRequired: false,
  });
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displayUrl = localPreview ?? logoDataUrl;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/barbers");
      const json = (await res.json()) as AdminMeta & ApiError;
      if (cancelled) return;
      setMeta({
        prototypeMode: json.prototypeMode ?? true,
        adminKeyRequired: json.adminKeyRequired ?? false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveLogo = useCallback(
    async (next: string | null) => {
      setSaving(true);
      setError(null);
      setMessage(null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (adminKey) headers["x-admin-key"] = adminKey;
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers,
          body: JSON.stringify({ logoDataUrl: next }),
        });
        const json = (await res.json()) as { logoDataUrl?: string | null } & ApiError;
        if (!res.ok) {
          setError(json.error?.message ?? t("admin.updateFailed"));
          if (res.status === 401) setAdminKey(null);
          return;
        }
        const saved = json.logoDataUrl ?? null;
        setLogoDataUrl(saved);
        setLocalPreview(null);
        setMessage(t("admin.logoSaved"));
        await refresh();
      } catch {
        setError(t("admin.updateFailed"));
      } finally {
        setSaving(false);
      }
    },
    [adminKey, refresh, setAdminKey, setLogoDataUrl, t],
  );

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const dataUrl = await fitLogoFile(file);
      setLocalPreview(dataUrl);
      await saveLogo(dataUrl);
    } catch (err) {
      setError(t("admin.logoInvalid"));
      if (err instanceof FitLogoError) return;
    }
  }

  if (meta.adminKeyRequired && !adminKey) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.settings")}</h1>
        <p className="text-sm text-zinc-400">{t("admin.unlockHint")}</p>
        <input
          type="password"
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          className="min-h-12 rounded-xl bg-zinc-900 px-3 outline-none ring-amber-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => {
            const next = keyInput.trim();
            if (next) setAdminKey(next);
          }}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          {t("admin.unlock")}
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          {meta.prototypeMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <h1 className="text-xl font-semibold">{t("admin.logoTitle")}</h1>
        </div>
        <Link
          href="/admin"
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
        >
          {t("admin.backToBoard")}
        </Link>
      </header>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <p className="text-sm text-zinc-400">{t("admin.logoHint")}</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from admin upload
            <img
              src={displayUrl}
              alt=""
              width={36}
              height={36}
              className="shrink-0 rounded-lg object-contain"
              style={{ width: 36, height: 36 }}
            />
          ) : (
            <BrandMark size={36} />
          )}
          <span className="text-sm font-bold tracking-[0.2em] text-amber-400">
            {t("common.brand")}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void onFileChange(event)}
        />
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.uploadLogo")}
          </button>
          <button
            type="button"
            disabled={saving || !displayUrl}
            onClick={() => void saveLogo(null)}
            className="min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-300 disabled:opacity-40"
          >
            {t("admin.resetLogo")}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </section>
    </div>
  );
}
