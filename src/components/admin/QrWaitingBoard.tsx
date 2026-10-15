"use client";

import { useCallback, useEffect, useState } from "react";
import type { QrQueuePublicView } from "@/lib/queue/qr-queue-types";

interface Props {
  shopApi: (path: string) => string;
  authHeaders: HeadersInit;
  enabled: boolean;
  onStarted: () => void;
}

export function QrWaitingBoard({ shopApi, authHeaders, enabled, onStarted }: Props) {
  const [entries, setEntries] = useState<QrQueuePublicView[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shorten, setShorten] = useState<{
    id: string;
    until: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(shopApi("/qr-queue"), { headers: authHeaders });
      if (!res.ok) return;
      const json = (await res.json()) as { entries?: QrQueuePublicView[] };
      setEntries(json.entries ?? []);
    } catch {
      /* ignore */
    }
  }, [authHeaders, enabled, shopApi]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const t = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(t);
  }, [load, enabled]);

  async function act(id: string, action: "start" | "left" | "cancel", endTime?: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(shopApi(`/qr-queue/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action, endTime, allowShorten: true }),
      });
      const json = (await res.json()) as {
        error?: { code?: string; message?: string; canShortenUntil?: string };
      };
      if (res.status === 409 && json.error?.canShortenUntil && action === "start") {
        setShorten({ id, until: json.error.canShortenUntil });
        return;
      }
      if (!res.ok) {
        setError(json.error?.message ?? "ทำรายการไม่สำเร็จ");
        return;
      }
      setShorten(null);
      await load();
      if (action === "start") onStarted();
    } catch {
      setError("ทำรายการไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  if (!enabled) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-rose-100">คิวรอ QR</h2>
        <span className="text-xs tabular-nums text-rose-200/80">{entries.length} คน</span>
      </div>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">ยังไม่มีคิวรอจาก QR</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((row) => {
            const barber =
              row.preferredBarberName ??
              (row.entry.preferred_barber_id ? "ช่างที่เลือก" : "ช่างที่ว่างก่อน");
            return (
              <li
                key={row.entry.id}
                className="rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      #{row.position} {row.entry.customer_name}
                    </p>
                    <p className="text-xs text-zinc-400">{barber}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === row.entry.id}
                      onClick={() => void act(row.entry.id, "start")}
                      className="min-h-10 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-zinc-950 disabled:opacity-50"
                    >
                      เริ่มตัด
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.entry.id}
                      onClick={() => void act(row.entry.id, "left")}
                      className="min-h-9 rounded-lg border border-zinc-600 px-3 text-xs text-zinc-200 disabled:opacity-50"
                    >
                      ลูกค้ากลับไปแล้ว
                    </button>
                  </div>
                </div>
                {shorten?.id === row.entry.id ? (
                  <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2">
                    <p className="text-xs text-amber-100">
                      ชนคิวจอง — ตัดให้จบก่อนคิวถัดไปได้
                    </p>
                    <button
                      type="button"
                      disabled={busyId === row.entry.id}
                      onClick={() => void act(row.entry.id, "start", shorten.until)}
                      className="mt-2 min-h-10 w-full rounded-lg bg-amber-400 text-xs font-semibold text-zinc-950"
                    >
                      เริ่มตัดแบบสั้น
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
