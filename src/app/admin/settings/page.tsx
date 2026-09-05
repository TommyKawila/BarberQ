"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useI18n } from "@/lib/i18n/locale-provider";
import { FitLogoError, fitLogoFile } from "@/lib/image/fit-logo";
import { normalizeShopName } from "@/lib/shop/shop-name";

const ADMIN_KEY = "barberq_admin_key";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface AdminMeta {
  prototypeMode: boolean;
  adminKeyRequired: boolean;
}

interface SettingsResponse {
  logoDataUrl?: string | null;
  shopName?: string | null;
}

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const { logoDataUrl, shopName, setLogoDataUrl, setShopName, refresh } = useShopBrand();
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useBrowserStorage(ADMIN_KEY);
  const [meta, setMeta] = useState<AdminMeta>({
    prototypeMode: true,
    adminKeyRequired: false,
  });
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displayUrl = localPreview ?? logoDataUrl;
  const [shopNameDraft, setShopNameDraft] = useState("");
  const [shopNameDirty, setShopNameDirty] = useState(false);
  const shopNameInput = shopNameDirty ? shopNameDraft : (shopName ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
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

  const putSettings = useCallback(
    async (body: { logoDataUrl?: string | null; shopName?: string | null }) => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (adminKey) headers["x-admin-key"] = adminKey;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as SettingsResponse & ApiError;
      if (!res.ok) {
        if (res.status === 401) setAdminKey(null);
        throw new Error(json.error?.message ?? t("admin.updateFailed"));
      }
      setLogoDataUrl(json.logoDataUrl ?? null);
      setShopName(json.shopName ?? null);
      await refresh();
      return json;
    },
    [adminKey, refresh, setAdminKey, setLogoDataUrl, setShopName, t],
  );

  const saveLogo = useCallback(
    async (next: string | null) => {
      setSavingLogo(true);
      setLogoError(null);
      setLogoMessage(null);
      try {
        await putSettings({ logoDataUrl: next });
        setLocalPreview(null);
        setLogoMessage(t("admin.logoSaved"));
      } catch (err) {
        setLogoError(err instanceof Error ? err.message : t("admin.updateFailed"));
      } finally {
        setSavingLogo(false);
      }
    },
    [putSettings, t],
  );

  const saveShopName = useCallback(async () => {
    setSavingName(true);
    setNameError(null);
    setNameMessage(null);
    const normalized = normalizeShopName(shopNameInput);
    if (normalized && (normalized.length < 1 || normalized.length > 40)) {
      setNameError(t("admin.shopNameInvalid"));
      setSavingName(false);
      return;
    }
    try {
      await putSettings({ shopName: normalized });
      setShopNameDirty(false);
      setNameMessage(t("admin.shopNameSaved"));
    } catch (err) {
      setNameError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingName(false);
    }
  }, [putSettings, shopNameInput, t]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLogoError(null);
    setLogoMessage(null);
    try {
      const dataUrl = await fitLogoFile(file);
      setLocalPreview(dataUrl);
      await saveLogo(dataUrl);
    } catch (err) {
      setLogoError(t("admin.logoInvalid"));
      if (err instanceof FitLogoError) return;
    }
  }

  const previewShopName = normalizeShopName(shopNameInput);

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
          <h1 className="text-xl font-semibold">{t("admin.settings")}</h1>
        </div>
        <Link
          href="/admin"
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
        >
          {t("admin.backToBoard")}
        </Link>
      </header>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.shopName")}</h2>
        <p className="mt-1 text-sm text-zinc-400">{t("admin.shopNameHint")}</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <BrandMark size={36} />
          <ShopNameLockup shopName={previewShopName} />
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          {t("admin.shopName")}
          <input
            value={shopNameInput}
            onChange={(event) => {
              setShopNameDirty(true);
              setShopNameDraft(event.target.value);
            }}
            placeholder={t("admin.shopNamePlaceholder")}
            maxLength={40}
            className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
          />
        </label>
        <button
          type="button"
          disabled={savingName}
          onClick={() => void saveShopName()}
          className="mt-3 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t("admin.saveShopName")}
        </button>
        {nameMessage ? <p className="mt-3 text-sm text-emerald-400">{nameMessage}</p> : null}
        {nameError ? <p className="mt-3 text-sm text-red-400">{nameError}</p> : null}
      </section>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.logoTitle")}</h2>
        <p className="mt-1 text-sm text-zinc-400">{t("admin.logoHint")}</p>
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
          <ShopNameLockup shopName={previewShopName} />
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
            disabled={savingLogo}
            onClick={() => inputRef.current?.click()}
            className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.uploadLogo")}
          </button>
          <button
            type="button"
            disabled={savingLogo || !displayUrl}
            onClick={() => void saveLogo(null)}
            className="min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-300 disabled:opacity-40"
          >
            {t("admin.resetLogo")}
          </button>
        </div>
        {logoMessage ? <p className="mt-3 text-sm text-emerald-400">{logoMessage}</p> : null}
        {logoError ? <p className="mt-3 text-sm text-red-400">{logoError}</p> : null}
      </section>
    </div>
  );
}
