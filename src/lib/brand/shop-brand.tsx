"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchShopSettingsCached,
  type PublicShopSettings,
} from "@/lib/shop/shop-settings-client";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import {
  clampBookingAdvanceDays,
  DEFAULT_BOOKING_ADVANCE_DAYS,
} from "@/lib/services/slot-service";

interface ShopBrandContextValue {
  logoDataUrl: string | null;
  coverImageUrl: string | null;
  shopName: string | null;
  lineUrl: string | null;
  phone: string | null;
  hours: ShopHours;
  remindersEnabled: boolean;
  reminderLeadMinutes: number;
  bookingAdvanceDays: number;
  loading: boolean;
  setLogoDataUrl: (value: string | null) => void;
  setCoverImageUrl: (value: string | null) => void;
  setShopName: (value: string | null) => void;
  setLineUrl: (value: string | null) => void;
  setPhone: (value: string | null) => void;
  /** Soft refresh (uses TTL cache). Pass force to bypass TTL. */
  refresh: (opts?: { force?: boolean }) => Promise<void>;
}

const ShopBrandContext = createContext<ShopBrandContextValue | null>(null);

function applySettings(
  json: PublicShopSettings,
  setters: {
    setLogoDataUrl: (v: string | null) => void;
    setCoverImageUrl: (v: string | null) => void;
    setShopName: (v: string | null) => void;
    setLineUrl: (v: string | null) => void;
    setPhone: (v: string | null) => void;
    setHours: (v: ShopHours) => void;
    setRemindersEnabled: (v: boolean) => void;
    setReminderLeadMinutes: (v: number) => void;
    setBookingAdvanceDays: (v: number) => void;
  },
) {
  setters.setLogoDataUrl(json.logoDataUrl ?? null);
  setters.setCoverImageUrl(json.coverImageUrl ?? null);
  setters.setShopName(json.shopName ?? null);
  setters.setLineUrl(json.lineUrl ?? null);
  setters.setPhone(json.phone ?? null);
  setters.setHours(normalizeShopHours(json.hours));
  setters.setRemindersEnabled(Boolean(json.remindersEnabled));
  setters.setReminderLeadMinutes(
    typeof json.reminderLeadMinutes === "number" ? json.reminderLeadMinutes : 120,
  );
  setters.setBookingAdvanceDays(
    clampBookingAdvanceDays(json.bookingAdvanceDays ?? DEFAULT_BOOKING_ADVANCE_DAYS),
  );
}

export function ShopBrandProvider({
  children,
  shopSlug,
}: {
  children: React.ReactNode;
  shopSlug: string;
}) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [hours, setHours] = useState<ShopHours>(() => normalizeShopHours(null));
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(120);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState(DEFAULT_BOOKING_ADVANCE_DAYS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      const setters = {
        setLogoDataUrl,
        setCoverImageUrl,
        setShopName,
        setLineUrl,
        setPhone,
        setHours,
        setRemindersEnabled,
        setReminderLeadMinutes,
        setBookingAdvanceDays,
      };
      try {
        let json: PublicShopSettings;
        try {
          json = await fetchShopSettingsCached(shopSlug, opts);
        } catch {
          // Cold start / transient failure — one forced retry.
          json = await fetchShopSettingsCached(shopSlug, { force: true });
        }
        applySettings(json, setters);
      } catch {
        /* keep prior / defaults */
      } finally {
        setLoading(false);
      }
    },
    [shopSlug],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      logoDataUrl,
      coverImageUrl,
      shopName,
      lineUrl,
      phone,
      hours,
      remindersEnabled,
      reminderLeadMinutes,
      bookingAdvanceDays,
      loading,
      setLogoDataUrl,
      setCoverImageUrl,
      setShopName,
      setLineUrl,
      setPhone,
      refresh,
    }),
    [
      logoDataUrl,
      coverImageUrl,
      shopName,
      lineUrl,
      phone,
      hours,
      remindersEnabled,
      reminderLeadMinutes,
      bookingAdvanceDays,
      loading,
      refresh,
    ],
  );

  return <ShopBrandContext.Provider value={value}>{children}</ShopBrandContext.Provider>;
}

export function useShopBrand() {
  const ctx = useContext(ShopBrandContext);
  if (!ctx) throw new Error("useShopBrand must be used within ShopBrandProvider");
  return ctx;
}
