"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { QrWaitingBoard } from "@/components/admin/QrWaitingBoard";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { QrQueuePublicView } from "@/lib/queue/qr-queue-types";

interface Props {
  shopApi: (path: string) => string;
  authHeaders: HeadersInit;
  enabled: boolean;
  onStarted: () => void;
}

/** Compact QR waiting strip matching ClipperQ Admin v3 Today (จัดคิว expands board). */
export function QrWaitingRow({ shopApi, authHeaders, enabled, onStarted }: Props) {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(shopApi("/qr-queue"), { headers: authHeaders });
      if (!res.ok) return;
      const json = (await res.json()) as { entries?: QrQueuePublicView[] };
      setCount(json.entries?.length ?? 0);
    } catch {
      /* ignore */
    }
  }, [authHeaders, enabled, shopApi]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const id = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(id);
  }, [enabled, load]);

  if (!enabled) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm"
      >
        <span className="flex items-center gap-2 text-zinc-100">
          <LayoutGrid size={18} className="text-amber-400" aria-hidden />
          {t("admin.qrWaitingRow").replace("{n}", String(count))}
        </span>
        <span className="font-medium text-amber-400">
          {t("admin.qrArrange")} {open ? "⌃" : ">"}
        </span>
      </button>
      {open ? (
        <QrWaitingBoard
          shopApi={shopApi}
          authHeaders={authHeaders}
          enabled
          onStarted={() => {
            onStarted();
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
