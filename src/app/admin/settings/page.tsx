"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { FitLogoError, fitLogoFile } from "@/lib/image/fit-logo";
import { normalizeShopName } from "@/lib/shop/shop-name";
import { DEFAULT_SHOP_HOURS, normalizeShopHours, type ShopDayHours, type ShopHours } from "@/lib/shop/shop-hours";
import type { MessageKey } from "@/lib/i18n/dictionary";
import {
  isValidShopLineUrl,
  isValidShopPhone,
  normalizeShopLineUrl,
  normalizeShopPhone,
} from "@/lib/shop/shop-contact";

const WEEKDAYS: { value: number; key: MessageKey }[] = [
  { value: 0, key: "common.sunday" },
  { value: 1, key: "common.monday" },
  { value: 2, key: "common.tuesday" },
  { value: 3, key: "common.wednesday" },
  { value: 4, key: "common.thursday" },
  { value: 5, key: "common.friday" },
  { value: 6, key: "common.saturday" },
];

interface ApiError {
  error?: { code?: string; message?: string };
}

interface SettingsResponse {
  logoDataUrl?: string | null;
  shopName?: string | null;
  lineUrl?: string | null;
  phone?: string | null;
  hours?: ShopHours | null;
}

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const { logoDataUrl, shopName, lineUrl, phone, setLogoDataUrl, setShopName, setLineUrl, setPhone, refresh } = useShopBrand();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displayUrl = localPreview ?? logoDataUrl;
  const [shopNameDraft, setShopNameDraft] = useState("");
  const [shopNameDirty, setShopNameDirty] = useState(false);
  const shopNameInput = shopNameDirty ? shopNameDraft : (shopName ?? "");
  const [lineUrlDraft, setLineUrlDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [contactDirty, setContactDirty] = useState(false);
  const lineUrlInput = contactDirty ? lineUrlDraft : (lineUrl ?? "");
  const phoneInput = contactDirty ? phoneDraft : (phone ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [hours, setHours] = useState<ShopDayHours[]>(() => DEFAULT_SHOP_HOURS.map((d) => ({ ...d })));
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    void (async () => {
      const res = await fetch(shopApi("/settings"), { headers: authHeaders });
      if (!res.ok) return;
      const json = (await res.json()) as SettingsResponse;
      if (json.hours) setHours(normalizeShopHours(json.hours));
    })();
  }, [authHeaders, profile, ready, shopApi]);

  const putSettings = useCallback(
    async (body: {
      logoDataUrl?: string | null;
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
      hours?: ShopHours;
    }) => {
      const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
      const res = await fetch(shopApi("/settings"), {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as SettingsResponse & ApiError;
      if (!res.ok) {
        throw new Error(json.error?.message ?? t("admin.updateFailed"));
      }
      setLogoDataUrl(json.logoDataUrl ?? null);
      setShopName(json.shopName ?? null);
      setLineUrl(json.lineUrl ?? null);
      setPhone(json.phone ?? null);
      await refresh();
      return json;
    },
    [authHeaders, refresh, setLogoDataUrl, setShopName, setLineUrl, setPhone, shopApi, t],
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

  const saveContact = useCallback(async () => {
    setSavingContact(true);
    setContactError(null);
    setContactMessage(null);
    const nextLine = normalizeShopLineUrl(lineUrlInput);
    const nextPhone = normalizeShopPhone(phoneInput);
    if (!isValidShopLineUrl(nextLine)) {
      setContactError(t("admin.shopLineInvalid"));
      setSavingContact(false);
      return;
    }
    if (!isValidShopPhone(nextPhone)) {
      setContactError(t("admin.shopPhoneInvalid"));
      setSavingContact(false);
      return;
    }
    try {
      await putSettings({ lineUrl: nextLine, phone: nextPhone });
      setContactDirty(false);
      setContactMessage(t("admin.contactSaved"));
    } catch (err) {
      setContactError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingContact(false);
    }
  }, [lineUrlInput, phoneInput, putSettings, t]);

  const saveHours = useCallback(async () => {
    setSavingHours(true);
    setHoursError(null);
    setHoursMessage(null);
    try {
      await putSettings({ hours: normalizeShopHours(hours) });
      setHoursMessage(t("admin.shopHoursSaved"));
    } catch (err) {
      setHoursError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingHours(false);
    }
  }, [hours, putSettings, t]);

  function updateHour(index: number, patch: Partial<ShopDayHours>) {
    setHours((current) =>
      current.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    );
  }

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
        <h1 className="text-2xl font-semibold">{t("admin.settings")}</h1>
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
        <Link href={shopPath("/admin")} className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <header className="flex items-start justify-between gap-2">
          <div>
            {mockMode ? (
              <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                {t("common.prototypeMode")}
              </span>
            ) : null}
            <h1 className="text-xl font-semibold">{t("admin.settings")}</h1>
            <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
          </div>
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
          <h2 className="text-sm font-semibold">{t("admin.contactTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.contactHint")}</p>
          <label className="mt-4 flex flex-col gap-1 text-sm">
            {t("admin.shopLineUrl")}
            <input
              value={lineUrlInput}
              onChange={(event) => {
                setContactDirty(true);
                setLineUrlDraft(event.target.value);
              }}
              placeholder={t("admin.shopLinePlaceholder")}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
            />
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            {t("admin.shopPhone")}
            <input
              value={phoneInput}
              onChange={(event) => {
                setContactDirty(true);
                setPhoneDraft(event.target.value);
              }}
              inputMode="tel"
              placeholder={t("booking.phonePlaceholder")}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
            />
          </label>
          <button
            type="button"
            disabled={savingContact}
            onClick={() => void saveContact()}
            className="mt-3 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.saveContact")}
          </button>
          {contactMessage ? <p className="mt-3 text-sm text-emerald-400">{contactMessage}</p> : null}
          {contactError ? <p className="mt-3 text-sm text-red-400">{contactError}</p> : null}
        </section>

        <section className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold">{t("admin.shopHours")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.shopHoursHint")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {WEEKDAYS.map((day) => {
              const row = hours[day.value];
              return (
                <div key={day.value} className="rounded-lg bg-zinc-950 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{t(day.key)}</span>
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={row.closed}
                        onChange={(e) => updateHour(day.value, { closed: e.target.checked })}
                      />
                      {t("admin.shopClosed")}
                    </label>
                  </div>
                  {!row.closed ? (
                    <div className="mt-2 flex gap-2">
                      <label className="flex flex-1 flex-col gap-1 text-xs">
                        {t("admin.shopOpenTime")}
                        <input
                          type="time"
                          value={row.open}
                          onChange={(e) => updateHour(day.value, { open: e.target.value })}
                          className="min-h-10 rounded-lg bg-zinc-800 px-2"
                        />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-xs">
                        {t("admin.shopCloseTime")}
                        <input
                          type="time"
                          value={row.close}
                          onChange={(e) => updateHour(day.value, { close: e.target.value })}
                          className="min-h-10 rounded-lg bg-zinc-800 px-2"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={savingHours}
            onClick={() => void saveHours()}
            className="mt-3 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.saveShopHours")}
          </button>
          {hoursMessage ? <p className="mt-3 text-sm text-emerald-400">{hoursMessage}</p> : null}
          {hoursError ? <p className="mt-3 text-sm text-red-400">{hoursError}</p> : null}
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
    </AdminShell>
  );
}
