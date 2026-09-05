"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useBrowserStorage(
  key: string,
): [string | null, (value: string | null) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [local, setLocal] = useState<string | null | undefined>(undefined);
  const value = local === undefined ? stored : local;

  const setValue = useCallback(
    (next: string | null) => {
      setLocal(next);
      try {
        if (next === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, next);
        }
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  return [value, setValue];
}
