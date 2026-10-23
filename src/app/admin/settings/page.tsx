"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  QrCode,
  Scissors,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { ShopNameLockup } from "@/components/layout/ShopNameLockup";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminContentSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { FitLogoError, fitLogoFile } from "@/lib/image/fit-logo";
import { CoverImageError } from "@/lib/image/validate-cover-image";
import { normalizeShopName } from "@/lib/shop/shop-name";
import { DEFAULT_SHOP_HOURS, normalizeShopHours, type ShopDayHours, type ShopHours } from "@/lib/shop/shop-hours";
import type { MessageKey } from "@/lib/i18n/dictionary";
import {
  isValidShopLineUrl,
  isValidShopPhone,
  normalizeShopLineUrl,
  normalizeShopPhone,
} from "@/lib/shop/shop-contact";
import {
  SETTINGS_SPY_HEADER_OFFSET_PX,
  findVerticalScrollRoot,
  getScrollTop,
  measureSectionTops,
  resolveActiveSettingsSection,
} from "@/lib/admin/settings-section-spy";

const WEEKDAYS: { value: number; key: MessageKey; shortTh: string; shortEn: string }[] = [
  { value: 0, key: "common.sunday", shortTh: "อา", shortEn: "Sun" },
  { value: 1, key: "common.monday", shortTh: "จ", shortEn: "Mon" },
  { value: 2, key: "common.tuesday", shortTh: "อ", shortEn: "Tue" },
  { value: 3, key: "common.wednesday", shortTh: "พ", shortEn: "Wed" },
  { value: 4, key: "common.thursday", shortTh: "พฤ", shortEn: "Thu" },
  { value: 5, key: "common.friday", shortTh: "ศ", shortEn: "Fri" },
  { value: 6, key: "common.saturday", shortTh: "ส", shortEn: "Sat" },
];

const COVER_DEFAULT_SRC = "/brand/cover-default.svg";

type SettingsSectionId =
  | "shop-info"
  | "shop-hours"
  | "line-notify"
  | "queue-pricing"
  | "managers";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface SettingsResponse {
  logoDataUrl?: string | null;
  coverImageUrl?: string | null;
  shopName?: string | null;
  lineUrl?: string | null;
  phone?: string | null;
  hours?: ShopHours | null;
  bookingAdvanceDays?: number;
}

interface CoverImageResponse {
  coverImageUrl?: string | null;
  error?: { code?: string; message?: string };
}

function SettingsRow({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 transition hover:bg-zinc-800/60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-100">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
    </Link>
  );
}

function SettingsRowGroup({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-900">
      {items.map((child, index) => (
        <div key={index} className={index > 0 ? "mx-4 border-t border-zinc-800" : undefined}>
          {child}
        </div>
      ))}
    </div>
  );
}

function DirtyActions({
  dirty,
  saving,
  saveLabel,
  onSave,
  onDiscard,
  t,
}: {
  dirty: boolean;
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onDiscard: () => void;
  t: (key: MessageKey) => string;
}) {
  if (!dirty) return null;
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-amber-400" aria-live="polite">
        {t("admin.unsavedChanges")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onDiscard}
          className="min-h-11 rounded-xl px-3 text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
        >
          {t("admin.discardChanges")}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="min-h-12 w-full rounded-xl bg-amber-400 px-4 font-semibold text-zinc-950 disabled:opacity-50 sm:w-auto"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

const MEDIA_BTN =
  "min-h-11 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200 disabled:opacity-50";
const TERTIARY_BTN = "min-h-11 rounded-xl px-3 text-sm text-zinc-400 disabled:opacity-40";
const SECTION_SCROLL = "scroll-mt-[72px]";
const CARD = "rounded-2xl bg-zinc-900 p-4";

function hoursEqual(a: ShopDayHours[], b: ShopDayHours[]) {
  return JSON.stringify(normalizeShopHours(a)) === JSON.stringify(normalizeShopHours(b));
}

/** Keep HH:mm for 24h display (never AM/PM). */
function normalizeClock(value: string): string | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return `${match[1]!.padStart(2, "0")}:${match[2]}`;
}

export default function AdminSettingsPage() {
  const { t, locale } = useI18n();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const {
    logoDataUrl,
    coverImageUrl,
    shopName,
    lineUrl,
    phone,
    setLogoDataUrl,
    setCoverImageUrl,
    setShopName,
    setLineUrl,
    setPhone,
    refresh,
  } = useShopBrand();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displayUrl = localPreview ?? logoDataUrl;
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const uploadedCoverUrl = coverPreview ?? coverImageUrl;
  const hasCover = Boolean(uploadedCoverUrl);
  const displayCoverUrl = uploadedCoverUrl || COVER_DEFAULT_SRC;
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
  const [savingCover, setSavingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [hours, setHours] = useState<ShopDayHours[]>(() => DEFAULT_SHOP_HOURS.map((d) => ({ ...d })));
  const [hoursBaseline, setHoursBaseline] = useState<ShopDayHours[]>(() =>
    DEFAULT_SHOP_HOURS.map((d) => ({ ...d })),
  );
  const [advanceDays, setAdvanceDays] = useState(30);
  const [advanceDaysBaseline, setAdvanceDaysBaseline] = useState(30);
  const hoursDirty =
    !hoursEqual(hours, hoursBaseline) || advanceDays !== advanceDaysBaseline;
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("shop-info");
  const inputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const scrollingToRef = useRef<string | null>(null);

  const isOwner = profile?.role === "owner";

  const sectionTabs = useMemo(
    () =>
      [
        { id: "shop-info" as const, labelKey: "admin.sectionShopInfo" as MessageKey },
        { id: "shop-hours" as const, labelKey: "admin.sectionHours" as MessageKey },
        { id: "line-notify" as const, labelKey: "admin.sectionLineNotify" as MessageKey },
        { id: "queue-pricing" as const, labelKey: "admin.sectionQueuePricing" as MessageKey },
        ...(isOwner
          ? [{ id: "managers" as const, labelKey: "admin.sectionManagers" as MessageKey }]
          : []),
      ] satisfies { id: SettingsSectionId; labelKey: MessageKey }[],
    [isOwner],
  );

  function coverErrorMessage(code: string | undefined): string {
    switch (code) {
      case "INVALID_TYPE":
        return t("admin.coverInvalidType");
      case "TOO_LARGE":
        return t("admin.coverTooLarge");
      case "EMPTY":
        return t("admin.coverEmpty");
      default:
        return t("admin.updateFailed");
    }
  }

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    void (async () => {
      const res = await fetch(shopApi("/settings"), { headers: authHeaders });
      if (!res.ok) return;
      const json = (await res.json()) as SettingsResponse;
      if (json.hours) {
        const next = normalizeShopHours(json.hours);
        setHours(next);
        setHoursBaseline(next.map((d) => ({ ...d })));
      }
      if (typeof json.bookingAdvanceDays === "number") {
        setAdvanceDays(json.bookingAdvanceDays);
        setAdvanceDaysBaseline(json.bookingAdvanceDays);
      }
    })();
  }, [authHeaders, profile, ready, shopApi]);

  const scrollToSection = useCallback((id: SettingsSectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrollingToRef.current = id;
    setActiveSection(id);
    const root = findVerticalScrollRoot(el);
    const [sectionTop] = measureSectionTops([el], root);
    const target = Math.max(0, (sectionTop ?? 0) - SETTINGS_SPY_HEADER_OFFSET_PX);
    if (root === window) {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      root.scrollTo({ top: target, behavior: "smooth" });
    }
    history.replaceState(null, "", `#${id}`);
    window.setTimeout(() => {
      if (scrollingToRef.current === id) scrollingToRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    const hash = window.location.hash.replace(/^#/, "") as SettingsSectionId | "";
    const validIds = sectionTabs.map((tab) => tab.id);
    if (hash && validIds.includes(hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, [profile, ready, scrollToSection, sectionTabs]);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    const ids = sectionTabs.map((tab) => tab.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const root = findVerticalScrollRoot(elements[0]!);

    const syncActive = () => {
      if (scrollingToRef.current) return;
      const next = resolveActiveSettingsSection({
        sectionIds: ids,
        sectionTops: measureSectionTops(elements, root),
        scrollTop: getScrollTop(root),
      });
      if (next) setActiveSection(next as SettingsSectionId);
    };

    syncActive();
    const onScroll = () => syncActive();
    const onResize = () => syncActive();
    if (root === window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      root.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onResize);
    return () => {
      if (root === window) {
        window.removeEventListener("scroll", onScroll);
      } else {
        root.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [profile, ready, sectionTabs]);

  const putSettings = useCallback(
    async (body: {
      logoDataUrl?: string | null;
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
      hours?: ShopHours;
      bookingAdvanceDays?: number;
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

  const discardShopName = useCallback(() => {
    setShopNameDirty(false);
    setShopNameDraft("");
    setNameError(null);
  }, []);

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

  const discardContact = useCallback(() => {
    setContactDirty(false);
    setLineUrlDraft("");
    setPhoneDraft("");
    setContactError(null);
  }, []);

  const saveHours = useCallback(async () => {
    setSavingHours(true);
    setHoursError(null);
    setHoursMessage(null);
    try {
      const next = normalizeShopHours(hours);
      const days = Math.min(90, Math.max(1, Math.round(advanceDays) || 30));
      await putSettings({ hours: next, bookingAdvanceDays: days });
      setHours(next);
      setHoursBaseline(next.map((d) => ({ ...d })));
      setAdvanceDays(days);
      setAdvanceDaysBaseline(days);
      setHoursMessage(t("admin.shopHoursSaved"));
    } catch (err) {
      setHoursError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingHours(false);
    }
  }, [hours, advanceDays, putSettings, t]);

  const discardHours = useCallback(() => {
    setHours(hoursBaseline.map((d) => ({ ...d })));
    setAdvanceDays(advanceDaysBaseline);
    setHoursError(null);
  }, [hoursBaseline, advanceDaysBaseline]);

  function updateHour(index: number, patch: Partial<ShopDayHours>) {
    setHours((current) => current.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  async function uploadCover(file: File) {
    setSavingCover(true);
    setCoverError(null);
    setCoverMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(shopApi("/settings/cover-image"), {
        method: "POST",
        headers: authHeaders,
        body: form,
      });
      const json = (await res.json()) as CoverImageResponse;
      if (!res.ok) {
        throw new Error(coverErrorMessage(json.error?.code));
      }
      setCoverPreview(json.coverImageUrl ?? null);
      setCoverImageUrl(json.coverImageUrl ?? null);
      await refresh();
      setCoverMessage(t("admin.coverSaved"));
    } catch (err) {
      if (err instanceof CoverImageError) {
        setCoverError(coverErrorMessage(err.code));
      } else {
        setCoverError(err instanceof Error ? err.message : t("admin.updateFailed"));
      }
    } finally {
      setSavingCover(false);
    }
  }

  async function deleteCover() {
    setSavingCover(true);
    setCoverError(null);
    setCoverMessage(null);
    try {
      const res = await fetch(shopApi("/settings/cover-image"), {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = (await res.json()) as CoverImageResponse;
      if (!res.ok) {
        throw new Error(coverErrorMessage(json.error?.code));
      }
      setCoverPreview(null);
      setCoverImageUrl(null);
      await refresh();
      setCoverMessage(t("admin.coverDeleted"));
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingCover(false);
    }
  }

  async function onCoverFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
    await uploadCover(file);
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

  const sectionIndexLinksMobile = (
    <div className="flex flex-wrap gap-2">
      {sectionTabs.map((tab) => {
        const active = activeSection === tab.id;
        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={active ? "true" : undefined}
            onClick={(event) => {
              event.preventDefault();
              scrollToSection(tab.id);
            }}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition ${
              active
                ? "bg-amber-400/15 text-amber-400"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t(tab.labelKey)}
          </a>
        );
      })}
    </div>
  );

  const sectionIndexLinksDesktop = (
    <div className="flex flex-col">
      {sectionTabs.map((tab) => {
        const active = activeSection === tab.id;
        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={active ? "true" : undefined}
            onClick={(event) => {
              event.preventDefault();
              scrollToSection(tab.id);
            }}
            className={`flex min-h-11 items-center border-l-2 px-3 text-sm transition ${
              active
                ? "border-amber-400 font-medium text-amber-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t(tab.labelKey)}
          </a>
        );
      })}
    </div>
  );

  if (!ready || !profile) {
    return (
      <AdminShell role="owner">
        <AdminContentSkeleton />
      </AdminShell>
    );
  }

  if (!isShopOperatorRole(profile.role)) {
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
      <div className="px-4 py-5">
        <header className="mb-6 flex items-start justify-between gap-2">
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

        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <nav
            aria-label={t("admin.settings")}
            className="sticky top-4 z-20 mb-4 hidden lg:block"
          >
            {sectionIndexLinksDesktop}
          </nav>

          <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
            <nav
              aria-label={t("admin.settings")}
              className="sticky top-0 z-20 -mx-4 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2 backdrop-blur lg:hidden"
            >
              {sectionIndexLinksMobile}
            </nav>

            <section id="shop-info" className={`${SECTION_SCROLL} flex flex-col gap-2`}>
              <h2 className="text-base font-semibold text-zinc-100">{t("admin.sectionShopInfo")}</h2>

              <div className={CARD}>
                <h3 className="text-sm font-semibold">{t("admin.shopName")}</h3>
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
                <DirtyActions
                  dirty={shopNameDirty}
                  saving={savingName}
                  saveLabel={t("admin.saveShopName")}
                  onSave={() => void saveShopName()}
                  onDiscard={discardShopName}
                  t={t}
                />
                {nameMessage ? <p className="mt-3 text-sm text-emerald-400">{nameMessage}</p> : null}
                {nameError ? <p className="mt-3 text-sm text-red-400">{nameError}</p> : null}
              </div>

              <div className={CARD}>
                <h3 className="text-sm font-semibold">{t("admin.coverTitle")}</h3>
                <p className="mt-1 text-sm text-zinc-400">{t("admin.coverHint")}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("admin.coverAspectHint")}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{t("admin.coverFormatHint")}</p>
                {!hasCover ? (
                  <p className="mt-2 text-sm text-zinc-400">{t("admin.coverNone")}</p>
                ) : null}
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element -- shop cover preview / brand default */}
                  <img
                    src={displayCoverUrl}
                    alt=""
                    className="aspect-video w-full object-cover object-center"
                  />
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void onCoverFileChange(event)}
                />
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={savingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className={MEDIA_BTN}
                  >
                    {savingCover
                      ? t("admin.coverUploading")
                      : hasCover
                        ? t("admin.changeCover")
                        : t("admin.uploadCover")}
                  </button>
                  {hasCover ? (
                    <button
                      type="button"
                      disabled={savingCover}
                      onClick={() => void deleteCover()}
                      className={TERTIARY_BTN}
                    >
                      {t("admin.deleteCover")}
                    </button>
                  ) : null}
                </div>
                {coverMessage ? <p className="mt-3 text-sm text-emerald-400">{coverMessage}</p> : null}
                {coverError ? <p className="mt-3 text-sm text-red-400">{coverError}</p> : null}
              </div>

              <div className={CARD}>
                <h3 className="text-sm font-semibold">{t("admin.logoTitle")}</h3>
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
                    className={MEDIA_BTN}
                  >
                    {t("admin.uploadLogo")}
                  </button>
                  <button
                    type="button"
                    disabled={savingLogo || !displayUrl}
                    onClick={() => void saveLogo(null)}
                    className={TERTIARY_BTN}
                  >
                    {t("admin.resetLogo")}
                  </button>
                </div>
                {logoMessage ? <p className="mt-3 text-sm text-emerald-400">{logoMessage}</p> : null}
                {logoError ? <p className="mt-3 text-sm text-red-400">{logoError}</p> : null}
              </div>

              <div className={CARD}>
                <h3 className="text-sm font-semibold">{t("admin.contactTitle")}</h3>
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
                <DirtyActions
                  dirty={contactDirty}
                  saving={savingContact}
                  saveLabel={t("admin.saveContact")}
                  onSave={() => void saveContact()}
                  onDiscard={discardContact}
                  t={t}
                />
                {contactMessage ? <p className="mt-3 text-sm text-emerald-400">{contactMessage}</p> : null}
                {contactError ? <p className="mt-3 text-sm text-red-400">{contactError}</p> : null}
              </div>
            </section>

            <section id="shop-hours" className={`${SECTION_SCROLL} flex flex-col gap-2`} lang="th">
              <h2 className="text-base font-semibold text-zinc-100">{t("admin.sectionHours")}</h2>
              <div className={CARD}>
                <p className="text-sm text-zinc-400">{t("admin.shopHoursHint")}</p>
                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-zinc-200">
                    {t("admin.bookingAdvanceDays")}
                  </span>
                  <span className="text-xs text-zinc-500">{t("admin.bookingAdvanceDaysHint")}</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={advanceDays}
                    onChange={(e) => setAdvanceDays(Number(e.target.value) || 1)}
                    className="mt-1 h-11 w-28 rounded-lg bg-zinc-800 px-3 text-sm tabular-nums text-zinc-100"
                    data-testid="booking-advance-days"
                  />
                </label>
                <div className="mt-4 overflow-hidden rounded-xl bg-zinc-950">
                  {WEEKDAYS.map((day, index) => {
                    const row = hours[day.value];
                    return (
                      <div
                        key={day.value}
                        className={`flex min-h-11 items-center gap-2 px-3 py-2 ${
                          index > 0 ? "border-t border-zinc-800" : ""
                        }`}
                      >
                        <span
                          className="inline-flex w-7 shrink-0 justify-center text-sm font-medium md:w-9"
                          title={t(day.key)}
                        >
                          {locale === "th" ? day.shortTh : day.shortEn}
                        </span>
                        {row.closed ? (
                          <p className="min-w-0 flex-1 text-sm text-zinc-400">
                            {t("admin.shopClosedDayHint")}
                          </p>
                        ) : (
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="HH:mm"
                              maxLength={5}
                              value={row.open}
                              aria-label={`${t(day.key)} ${t("admin.shopOpenTime")}`}
                              onChange={(e) => {
                                const next = e.target.value;
                                if (/^\d{0,2}(:\d{0,2})?$/.test(next)) {
                                  updateHour(day.value, { open: next });
                                }
                              }}
                              onBlur={() => {
                                const normalized = normalizeClock(row.open);
                                if (normalized && normalized !== row.open) {
                                  updateHour(day.value, { open: normalized });
                                }
                              }}
                              className="h-11 w-[76px] rounded-lg bg-zinc-800 px-1 text-center text-sm tabular-nums md:w-[120px] md:px-2"
                            />
                            <span className="shrink-0 text-zinc-500" aria-hidden>
                              –
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="HH:mm"
                              maxLength={5}
                              value={row.close}
                              aria-label={`${t(day.key)} ${t("admin.shopCloseTime")}`}
                              onChange={(e) => {
                                const next = e.target.value;
                                if (/^\d{0,2}(:\d{0,2})?$/.test(next)) {
                                  updateHour(day.value, { close: next });
                                }
                              }}
                              onBlur={() => {
                                const normalized = normalizeClock(row.close);
                                if (normalized && normalized !== row.close) {
                                  updateHour(day.value, { close: normalized });
                                }
                              }}
                              className="h-11 w-[76px] rounded-lg bg-zinc-800 px-1 text-center text-sm tabular-nums md:w-[120px] md:px-2"
                            />
                          </div>
                        )}
                        <label className="flex min-h-11 shrink-0 items-center gap-2 text-xs text-zinc-400">
                          <input
                            type="checkbox"
                            checked={row.closed}
                            onChange={(e) => updateHour(day.value, { closed: e.target.checked })}
                            className="h-5 w-5"
                          />
                          {t("admin.shopClosed")}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <DirtyActions
                  dirty={hoursDirty}
                  saving={savingHours}
                  saveLabel={t("admin.saveShopHours")}
                  onSave={() => void saveHours()}
                  onDiscard={discardHours}
                  t={t}
                />
                {hoursMessage ? <p className="mt-3 text-sm text-emerald-400">{hoursMessage}</p> : null}
                {hoursError ? <p className="mt-3 text-sm text-red-400">{hoursError}</p> : null}
              </div>
            </section>

            <section id="line-notify" className={`${SECTION_SCROLL} flex flex-col gap-2`}>
              <h2 className="text-base font-semibold text-zinc-100">{t("admin.sectionLineNotify")}</h2>
              <SettingsRowGroup>
                <SettingsRow
                  href={shopPath("/admin/settings/line")}
                  icon={MessageCircle}
                  title={t("admin.settingsLine")}
                  subtitle={t("admin.settingsLineHint")}
                />
                <SettingsRow
                  href={shopPath("/admin/settings/notifications")}
                  icon={Bell}
                  title={t("admin.settingsNotifications")}
                  subtitle={t("admin.settingsNotificationsHint")}
                />
                <SettingsRow
                  href={shopPath("/admin/settings/reminders")}
                  icon={Clock3}
                  title={t("admin.settingsReminders")}
                  subtitle={t("admin.settingsRemindersHint")}
                />
                <SettingsRow
                  href={shopPath("/admin/settings/message-cost")}
                  icon={CircleDollarSign}
                  title={t("admin.settingsMessageCost")}
                  subtitle={t("admin.settingsMessageCostHint")}
                />
              </SettingsRowGroup>
            </section>

            <section id="queue-pricing" className={`${SECTION_SCROLL} flex flex-col gap-2`}>
              <h2 className="text-base font-semibold text-zinc-100">{t("admin.sectionQueuePricing")}</h2>
              <SettingsRowGroup>
                <SettingsRow
                  href={shopPath("/admin/settings/qr-queue")}
                  icon={QrCode}
                  title={t("admin.settingsQrQueue")}
                  subtitle={t("admin.settingsQrQueueHint")}
                />
                <SettingsRow
                  href={shopPath("/admin/settings/services")}
                  icon={Scissors}
                  title={t("admin.servicesTitle")}
                  subtitle={t("admin.servicesHint")}
                />
              </SettingsRowGroup>
            </section>

            {isOwner ? (
              <section id="managers" className={`${SECTION_SCROLL} flex flex-col gap-2`}>
                <h2 className="text-base font-semibold text-zinc-100">{t("admin.sectionManagers")}</h2>
                <SettingsRowGroup>
                  <SettingsRow
                    href={shopPath("/admin/settings/managers")}
                    icon={Users}
                    title={t("admin.managersTitle")}
                    subtitle={t("admin.managersHint")}
                  />
                </SettingsRowGroup>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
