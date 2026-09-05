"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface ShopBrandContextValue {
  logoDataUrl: string | null;
  loading: boolean;
  setLogoDataUrl: (value: string | null) => void;
  refresh: () => Promise<void>;
}

const ShopBrandContext = createContext<ShopBrandContextValue | null>(null);

export function ShopBrandProvider({ children }: { children: React.ReactNode }) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const json = (await res.json()) as { logoDataUrl?: string | null };
      setLogoDataUrl(json.logoDataUrl ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

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
    () => ({ logoDataUrl, loading, setLogoDataUrl, refresh }),
    [logoDataUrl, loading, refresh],
  );

  return <ShopBrandContext.Provider value={value}>{children}</ShopBrandContext.Provider>;
}

export function useShopBrand() {
  const ctx = useContext(ShopBrandContext);
  if (!ctx) throw new Error("useShopBrand must be used within ShopBrandProvider");
  return ctx;
}
