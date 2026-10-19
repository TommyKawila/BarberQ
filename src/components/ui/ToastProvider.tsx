"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastInput {
  message: string;
  kind?: ToastKind;
  /** ms; default 3200 */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, "message" | "kind" | "duration">> {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_CLASS: Record<ToastKind, string> = {
  success: "border-emerald-500/40 bg-zinc-800 text-zinc-100",
  error: "border-red-500/50 bg-zinc-800 text-red-400",
  info: "border-zinc-600 bg-zinc-800 text-zinc-100",
  warning: "border-orange-400/50 bg-zinc-800 text-orange-200",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const liveId = useId();

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput | string) => {
      const normalized: ToastInput = typeof input === "string" ? { message: input } : input;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        message: normalized.message,
        kind: normalized.kind ?? "info",
        duration: normalized.duration ?? 3200,
      };
      setItems((prev) => [...prev.slice(-3), item]);
      const timer = window.setTimeout(() => dismiss(id), item.duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) window.clearTimeout(timer);
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast({ message, kind: "success" }),
      error: (message) => toast({ message, kind: "error" }),
      info: (message) => toast({ message, kind: "info" }),
      warning: (message) => toast({ message, kind: "warning" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        id={liveId}
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`cq-toast-enter pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${KIND_CLASS[item.kind]}`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
