"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { thaiQrQueueError } from "@/lib/queue/qr-queue-errors";
import type { QrQueuePublicView } from "@/lib/queue/qr-queue-types";

interface Props {
  shopApi: (path: string) => string;
  authHeaders: HeadersInit;
  enabled: boolean;
  onStarted: () => void;
}

type RowAlert =
  | { kind: "error"; message: string }
  | { kind: "shorten"; message: string; until: string };

type BusyAction = "start" | "left" | "cancel";

type BusyState = { id: string; action: BusyAction };

/** Pressed = full color; sibling = slight dim only (not the same heavy fade). */
function actionButtonClass(opts: {
  base: string;
  pressed: boolean;
  panelBusy: boolean;
}): string {
  const dim = opts.panelBusy && !opts.pressed ? "opacity-80" : "opacity-100";
  return `${opts.base} ${dim}`;
}

export function QrWaitingBoard({ shopApi, authHeaders, enabled, onStarted }: Props) {
  const [entries, setEntries] = useState<QrQueuePublicView[]>([]);
  const [busy, setBusy] = useState<BusyState | null>(null);
  /** Feedback for the row that was just acted on (error or shorten offer). */
  const [alertById, setAlertById] = useState<Record<string, RowAlert>>({});

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

  function clearAlert(id: string) {
    setAlertById((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setRowAlert(id: string, alert: RowAlert) {
    setAlertById((prev) => ({ ...prev, [id]: alert }));
  }

  async function act(id: string, action: BusyAction, endTime?: string) {
    setBusy({ id, action });
    clearAlert(id);
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
        setRowAlert(id, {
          kind: "shorten",
          message: thaiQrQueueError("SLOT_TAKEN"),
          until: json.error.canShortenUntil,
        });
        return;
      }
      if (!res.ok) {
        setRowAlert(id, {
          kind: "error",
          message: thaiQrQueueError(
            json.error?.code,
            json.error?.message ?? "ทำรายการไม่สำเร็จ",
          ),
        });
        return;
      }
      clearAlert(id);
      await load();
      if (action === "start") onStarted();
    } catch {
      setRowAlert(id, { kind: "error", message: "ทำรายการไม่สำเร็จ" });
    } finally {
      setBusy(null);
    }
  }

  if (!enabled) return null;

  const panelBusy = busy !== null;

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
            const startBusy = busy?.id === row.entry.id && busy.action === "start";
            const leftBusy = busy?.id === row.entry.id && busy.action === "left";
            const alert = alertById[row.entry.id];
            return (
              <li
                key={row.entry.id}
                className="rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-3"
                data-qr-entry={row.entry.id}
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
                      disabled={panelBusy}
                      onClick={() => void act(row.entry.id, "start")}
                      aria-busy={startBusy}
                      data-qr-busy={startBusy ? "start" : undefined}
                      className={actionButtonClass({
                        base: "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-zinc-950 disabled:cursor-not-allowed",
                        pressed: startBusy,
                        panelBusy,
                      })}
                    >
                      {startBusy ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          กำลังเริ่ม…
                        </>
                      ) : (
                        "เริ่มตัด"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={panelBusy}
                      onClick={() => void act(row.entry.id, "left")}
                      aria-busy={leftBusy}
                      data-qr-busy={leftBusy ? "left" : undefined}
                      className={actionButtonClass({
                        base: "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-600 px-3 text-xs text-zinc-200 disabled:cursor-not-allowed",
                        pressed: leftBusy,
                        panelBusy,
                      })}
                    >
                      {leftBusy ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          กำลังบันทึก…
                        </>
                      ) : (
                        "ลูกค้ากลับไปแล้ว"
                      )}
                    </button>
                  </div>
                </div>

                {alert?.kind === "error" ? (
                  <div
                    role="alert"
                    data-qr-alert="error"
                    className="mt-3 flex gap-2.5 rounded-lg border border-red-500/60 bg-red-950/70 px-3 py-2.5 text-red-50 shadow-sm shadow-red-950/40"
                  >
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-300"
                      aria-hidden
                    />
                    <p className="text-sm font-semibold leading-snug">{alert.message}</p>
                  </div>
                ) : null}

                {alert?.kind === "shorten" ? (
                  <div
                    role="status"
                    data-qr-alert="shorten"
                    className="mt-3 rounded-lg border border-amber-500/60 bg-amber-500/15 p-3 shadow-sm shadow-amber-950/30"
                  >
                    <div className="flex gap-2.5">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-amber-50">
                          {alert.message}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-amber-100/90">
                          ชนคิวจอง — ตัดให้จบก่อนคิวถัดไปได้
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={panelBusy}
                      onClick={() => void act(row.entry.id, "start", alert.until)}
                      aria-busy={startBusy}
                      data-qr-busy={startBusy ? "start" : undefined}
                      className={actionButtonClass({
                        base: "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed",
                        pressed: startBusy,
                        panelBusy,
                      })}
                    >
                      {startBusy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          กำลังเริ่ม…
                        </>
                      ) : (
                        "เริ่มตัดแบบสั้น"
                      )}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
