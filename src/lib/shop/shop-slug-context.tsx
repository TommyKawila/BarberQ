"use client";

import { createContext, useContext, useMemo } from "react";

interface ShopSlugContextValue {
  shopSlug: string;
  shopApi: (path: string) => string;
  shopPath: (path: string) => string;
}

const ShopSlugContext = createContext<ShopSlugContextValue | null>(null);

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function ShopSlugProvider({
  shopSlug,
  children,
}: {
  shopSlug: string;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      shopSlug,
      shopApi: (path: string) => `/api/${shopSlug}${normalizePath(path)}`,
      shopPath: (path: string) => `/${shopSlug}${normalizePath(path)}`,
    }),
    [shopSlug],
  );

  return <ShopSlugContext.Provider value={value}>{children}</ShopSlugContext.Provider>;
}

export function useShopSlug(): ShopSlugContextValue {
  const ctx = useContext(ShopSlugContext);
  if (!ctx) throw new Error("useShopSlug must be used within ShopSlugProvider");
  return ctx;
}
