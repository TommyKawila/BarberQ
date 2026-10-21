"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BLOCK_REASON_CODES,
  blockConfirmSummary,
  blockTimeOptions,
  combineDateAndHm,
  hmFromISO,
  nextBlockStartISO,
  overlappingBookings,
  quickBlockEndISO,
  type BlockQuickKind,
  type BlockReasonCode,
} from "@/lib/admin/block-time";
import { useI18n } from "@/lib/i18n/locale-provider";
import { dateISOFromInstant } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
import type { AdminColumn } from "@/types/booking";

interface BlockTimeSheetProps {
  open: boolean;
  barberId: string;
  barberName: string;
  column: AdminColumn;
  shopHours: ShopHours;
  /** Optional prefill (e.g. tapped free cell). */
  initialStartISO?: string | null;
  freeUntilISO?: string | null;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (input: {
    barberId: string;
    startTime: string;
    endTime: string;
    reason: BlockReasonCode;
  }) => void;
}

const QUICK: { kind: BlockQuickKind; labelKey: string }[] = [
  { kind: "30m", labelKey: "admin.blockQuick.30m" },
  { kind: "1h", labelKey: "admin.blockQuick.1h" },
  { kind: "noon", labelKey: "admin.blockQuick.noon" },
  { kind: "restOfDay", labelKey: "admin.blockQuick.restOfDay" },
];

export function BlockTimeSheet({
  open,
  barberId,
  barberName,
  column,
  shopHours,
  initialStartISO = null,
  freeUntilISO = null,
  pending = false,
  onClose,
  onConfirm,
}: BlockTimeSheetProps) {
  const { t } = useI18n();
  const timeOpts = useMemo(() => blockTimeOptions(column), [column]);
  const [startHm, setStartHm] = useState("10:00");
  const [endHm, setEndHm] = useState("10:30");
  const [reason, setReason] = useState<BlockReasonCode | "">("");
  const [quick, setQuick] = useState<BlockQuickKind | null>("30m");

  useEffect(() => {
    if (!open) return;
    const startISO = initialStartISO || nextBlockStartISO(column, new Date());
    if (!startISO) return;
    const dateISO = dateISOFromInstant(new Date(startISO));
    const sHm = hmFromISO(startISO);
    setStartHm(sHm);
    const endISO = quickBlockEndISO(startISO, "30m", { shopHours, freeUntilISO });
    setEndHm(endISO ? hmFromISO(endISO) : sHm);
    setQuick("30m");
    setReason("");
    void dateISO;
  }, [open, barberId, initialStartISO, column, shopHours, freeUntilISO]);

  if (!open) return null;

  const dateISO = dateISOFromInstant(
    new Date(initialStartISO || nextBlockStartISO(column) || Date.now()),
  );
  const startISO = combineDateAndHm(dateISO, startHm);
  const endISO = combineDateAndHm(dateISO, endHm);
  const rangeOk = new Date(endISO).getTime() > new Date(startISO).getTime();
  const overlaps = rangeOk ? overlappingBookings(column, startISO, endISO) : [];
  const confirmLabel = rangeOk
    ? blockConfirmSummary(t("admin.blockConfirm"), barberName, startISO, endISO)
    : t("admin.blockConfirmInvalid");

  function applyQuick(kind: BlockQuickKind) {
    setQuick(kind);
    const start = combineDateAndHm(dateISO, startHm);
    const end = quickBlockEndISO(start, kind, { shopHours, freeUntilISO });
    if (end) setEndHm(hmFromISO(end));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        onClick={() => {
          if (!pending) onClose();
        }}
        disabled={pending}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-testid="block-time-sheet"
        className="relative z-10 flex max-h-[min(92vh,40rem)] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700 sm:hidden" />
        <header className="mb-3">
          <h2 className="text-base font-semibold text-zinc-50">{t("admin.blockSheetTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-300">
            {t("admin.blockSheetSubtitle").replace("{name}", barberName)}
          </p>
        </header>

        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-zinc-400">{t("admin.blockQuickLabel")}</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK.map(({ kind, labelKey }) => {
              const disabled =
                kind === "noon" &&
                !quickBlockEndISO(combineDateAndHm(dateISO, startHm), "noon", {
                  shopHours,
                  freeUntilISO,
                });
              const selected = quick === kind;
              const label =
                kind === "30m"
                  ? t("admin.blockQuick.30m")
                  : kind === "1h"
                    ? t("admin.blockQuick.1h")
                    : kind === "noon"
                      ? t("admin.blockQuick.noon")
                      : t("admin.blockQuick.restOfDay");
              void labelKey;
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={pending || disabled}
                  data-testid={`block-quick-${kind}`}
                  onClick={() => applyQuick(kind)}
                  className={`cq-press min-h-11 rounded-xl border text-sm font-semibold disabled:opacity-40 ${
                    selected
                      ? "border-amber-400 bg-amber-400/15 text-zinc-50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {t("admin.startTime")}
            <select
              data-testid="block-start"
              disabled={pending}
              value={startHm}
              onChange={(e) => {
                setQuick(null);
                setStartHm(e.target.value);
              }}
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-50"
            >
              {timeOpts.map((hm) => (
                <option key={`s-${hm}`} value={hm}>
                  {hm}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {t("admin.endTime")}
            <select
              data-testid="block-end"
              disabled={pending}
              value={endHm}
              onChange={(e) => {
                setQuick(null);
                setEndHm(e.target.value);
              }}
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-50"
            >
              {timeOpts.map((hm) => (
                <option key={`e-${hm}`} value={hm}>
                  {hm}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-zinc-400">{t("admin.blockReasonLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_REASON_CODES.map((code) => {
              const selected = reason === code;
              const reasonLabel =
                code === "rest"
                  ? t("admin.blockReason.rest")
                  : code === "errand"
                    ? t("admin.blockReason.errand")
                    : t("admin.blockReason.other");
              return (
                <button
                  key={code}
                  type="button"
                  disabled={pending}
                  data-testid={`block-reason-${code}`}
                  onClick={() => setReason(selected ? "" : code)}
                  className={`cq-press min-h-10 rounded-xl border px-3 text-sm font-medium disabled:opacity-50 ${
                    selected
                      ? "border-amber-400 bg-amber-400/15 text-zinc-50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-200"
                  }`}
                >
                  {reasonLabel}
                </button>
              );
            })}
          </div>
        </div>

        {overlaps.length > 0 ? (
          <p
            className="mb-3 rounded-xl border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
            data-testid="block-overlap-warn"
            role="status"
          >
            {t("admin.blockOverlapWarn").replace("{n}", String(overlaps.length))}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending || !rangeOk}
          data-testid="block-confirm"
          aria-busy={pending || undefined}
          onClick={() =>
            onConfirm({
              barberId,
              startTime: startISO,
              endTime: endISO,
              reason: reason || "other",
            })
          }
          className="cq-press flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? (
            <>
              <span className="cq-btn-spinner" aria-hidden />
              {t("admin.blockPending")}
            </>
          ) : (
            confirmLabel
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="cq-press mt-2 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-zinc-300 disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
