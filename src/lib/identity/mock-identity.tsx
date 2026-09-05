"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CustomerIdentity {
  ref: string;
  displayName: string;
}

interface IdentityContextValue {
  ready: boolean;
  identity: CustomerIdentity | null;
}

const IdentityContext = createContext<IdentityContextValue>({
  ready: false,
  identity: null,
});

const REF_KEY = "barberq_customer_ref";

function loadOrCreateRef(): string {
  try {
    const stored = window.localStorage.getItem(REF_KEY);
    if (stored) return stored;
    const ref = `mock-${crypto.randomUUID()}`;
    window.localStorage.setItem(REF_KEY, ref);
    return ref;
  } catch {
    return `mock-${crypto.randomUUID()}`;
  }
}

export function MockIdentityProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<CustomerIdentity | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIdentity({ ref: loadOrCreateRef(), displayName: "" });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ ready, identity }), [ready, identity]);
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useCustomerIdentity(): IdentityContextValue {
  return useContext(IdentityContext);
}
