"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useBrowserStorage } from "@/lib/browser-storage";
import { dictionary, type Locale, type MessageKey } from "./dictionary";
import { resolveLocale } from "./resolve-locale";

const LOCALE_KEY = "barberq_locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useBrowserStorage(LOCALE_KEY);
  // Does not erase localStorage — resolveLocale ignores stored "en" when flag is off.
  const locale = resolveLocale(stored);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setStored(next);
    },
    [setStored],
  );

  const t = useCallback(
    (key: MessageKey) => dictionary[locale][key],
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
