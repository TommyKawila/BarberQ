"use client";

import { useCallback, useEffect, useState } from "react";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { useBrowserStorage } from "@/lib/browser-storage";
import { dateISOFromInstant } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot } from "@/types/booking";

const ADMIN_KEY = "barberq_admin_key";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface AdminMeta {
  prototypeMode: boolean;
  adminKeyRequired: boolean;
}

export default function AdminPage() {
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useBrowserStorage(ADMIN_KEY);
  const [columns, setColumns] = useState<AdminColumn[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<AdminMeta>({
    prototypeMode: true,
    adminKeyRequired: false,
  });
  const [dateISO] = useState(() => dateISOFromInstant(new Date()));

  const loadDay = useCallback(async () => {
    const headers: HeadersInit = {};
    if (adminKey) headers["x-admin-key"] = adminKey;
    const res = await fetch(`/api/block?date=${encodeURIComponent(dateISO)}`, { headers });
    const json = (await res.json()) as {
      columns?: AdminColumn[];
      prototypeMode?: boolean;
      adminKeyRequired?: boolean;
    } & ApiError;
    if (!res.ok) {
      setError(json.error?.message ?? "Failed to load");
      if (res.status === 401) setAdminKey(null);
      return;
    }
    setError(null);
    setColumns(json.columns ?? []);
    setMeta({
      prototypeMode: json.prototypeMode ?? true,
      adminKeyRequired: json.adminKeyRequired ?? false,
    });
  }, [adminKey, dateISO, setAdminKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/barbers");
      const json = (await res.json()) as AdminMeta & ApiError;
      if (cancelled) return;
      setMeta({
        prototypeMode: json.prototypeMode ?? true,
        adminKeyRequired: json.adminKeyRequired ?? false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (meta.adminKeyRequired && !adminKey) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadDay();
    })();
    const timer = window.setInterval(() => {
      void loadDay();
    }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [adminKey, loadDay, meta.adminKeyRequired]);

  function unlock() {
    const next = keyInput.trim();
    if (!next) return;
    setAdminKey(next);
  }

  async function onToggle(barberId: string, slot: AdminSlot) {
    if (meta.adminKeyRequired && !adminKey) return;
    const key = `${barberId}:${slot.startTime}`;
    setPendingKey(key);
    setError(null);
    const previous = columns;

    setColumns((current) =>
      current.map((column) => {
        if (column.barber.id !== barberId) return column;
        return {
          ...column,
          slots: column.slots.map((item) => {
            if (item.startTime !== slot.startTime) return item;
            if (slot.kind === "blocked") {
              return { ...item, kind: "free", available: true, blockId: undefined, reason: undefined };
            }
            return { ...item, kind: "blocked", available: false, reason: "walk-in" };
          }),
        };
      }),
    );

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (adminKey) headers["x-admin-key"] = adminKey;

    try {
      const res =
        slot.kind === "blocked"
          ? await fetch("/api/block", {
              method: "DELETE",
              headers,
              body: JSON.stringify({ id: slot.blockId }),
            })
          : await fetch("/api/block", {
              method: "POST",
              headers,
              body: JSON.stringify({
                barberId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                reason: "walk-in",
              }),
            });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setColumns(previous);
        setError(json.error?.message ?? "Update failed");
        return;
      }
      await loadDay();
    } catch {
      setColumns(previous);
      setError("Update failed");
    } finally {
      setPendingKey(null);
    }
  }

  if (meta.adminKeyRequired && !adminKey) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-400">Enter shop key to open today&apos;s board</p>
        <input
          type="password"
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          className="min-h-12 rounded-xl bg-zinc-900 px-3 outline-none ring-amber-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={unlock}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          Unlock
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          {meta.prototypeMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              Prototype mode
            </span>
          ) : null}
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400">BARBERQ</p>
          <h1 className="text-xl font-semibold">Today · tap to block</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-zinc-500">{dateISO}</p>
          <button
            type="button"
            onClick={() => void loadDay()}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
          >
            Refresh
          </button>
        </div>
      </header>
      <div className="flex gap-2 text-[11px] text-zinc-400">
        <span className="rounded bg-emerald-700 px-2 py-0.5 text-white">Open</span>
        <span className="rounded bg-red-600 px-2 py-0.5 text-white">Walk-in</span>
        <span className="rounded bg-sky-700 px-2 py-0.5 text-white">Booked</span>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <QuickBlockGrid
        columns={columns}
        pendingKey={pendingKey}
        onToggle={(id, slot) => void onToggle(id, slot)}
      />
    </div>
  );
}
