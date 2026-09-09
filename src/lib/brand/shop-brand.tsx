"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";

interface ShopBrandContextValue {
  logoDataUrl: string | null;
  shopName: string | null;
  lineUrl: string | null;
  phone: string | null;
  hours: ShopHours;
  loading: boolean;
  setLogoDataUrl: (value: string | null) => void;
  setShopName: (value: string | null) => void;
  setLineUrl: (value: string | null) => void;
  setPhone: (value: string | null) => void;
  refresh: () => Promise<void>;
}

const ShopBrandContext = createContext<ShopBrandContextValue | null>(null);

export function ShopBrandProvider({
  children,
  shopSlug,
}: {
  children: React.ReactNode;
  shopSlug: string;
}) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [hours, setHours] = useState<ShopHours>(() => normalizeShopHours(null));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/${shopSlug}/settings`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        logoDataUrl?: string | null;
        shopName?: string | null;
        lineUrl?: string | null;
        phone?: string | null;
        hours?: ShopHours | null;
      };
      setLogoDataUrl(json.logoDataUrl ?? null);
      setShopName(json.shopName ?? null);
      setLineUrl(json.lineUrl ?? null);
      setPhone(json.phone ?? null);
      setHours(normalizeShopHours(json.hours));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [shopSlug]);

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
      shopName,
      lineUrl,
      phone,
      hours,
      loading,
      setLogoDataUrl,
      setShopName,
      setLineUrl,
      setPhone,
      refresh,
    }),
    [logoDataUrl, shopName, lineUrl, phone, hours, loading, refresh],
  );

  return <ShopBrandContext.Provider value={value}>{children}</ShopBrandContext.Provider>;
}

export function useShopBrand() {
  const ctx = useContext(ShopBrandContext);
  if (!ctx) throw new Error("useShopBrand must be used within ShopBrandProvider");
  return ctx;
}
