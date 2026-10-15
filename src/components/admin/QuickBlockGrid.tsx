"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookedSlotActionsSheet,
  type BookedSlotSheetAction,
} from "@/components/admin/BookedSlotActionsSheet";
import { getBookedCardActions } from "@/lib/admin/board-card-actions";
import { NO_SHOW_WARNING_THRESHOLD } from "@/lib/admin/customer-no-show";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime } from "@/lib/services/slot-service";
import {
  barberLabel,
  type AdminColumn,
  type AdminSlot,
  type AppointmentSource,
} from "@/types/booking";

interface QuickBlockGridProps {
  columns: AdminColumn[];
  pendingKey: string | null;
  outcomePendingKey?: string | null;
  latePendingKey?: string | null;
  cancelPendingKey?: string | null;
  editableBarberId?: string | null;
  onFreeSlot: (barberId: string, slot: AdminSlot) => void;
  onWalkInQuick?: (barberId: string) => void;
  onOutcome?: (
    barberId: string,
    slot: AdminSlot,
    outcome: "completed" | "no_show" | "left",
  ) => void;
  onLateCalled?: (barberId: string, slot: AdminSlot) => void;
  onCancel?: (barberId: string, slot: AdminSlot) => void;
  onRescheduleStart?: (barberId: string, slot: AdminSlot) => void;
  onUnblock?: (barberId: string, slot: AdminSlot) => void;
  bookingHref?: string;
  onCopyBookingLink?: () => void;
  bookingLinkCopied?: boolean;
}

function sourceBadge(
  source: AppointmentSource | undefined,
  t: (k: "admin.sourceLine" | "admin.sourcePhone" | "admin.sourceChat" | "admin.sourceWalkIn") => string,
  viaQr?: boolean,
): string {
  if (source === "walk_in") {
    return viaQr ? `🚶 ${t("admin.sourceWalkIn")} · QR` : `🚶 ${t("admin.sourceWalkIn")}`;
  }
  if (source === "phone") return `📞 ${t("admin.sourcePhone")}`;
  if (source === "chat") return `💬 ${t("admin.sourceChat")}`;
  return t("admin.sourceLine");
}

function slotClass(slot: AdminSlot, pending: boolean): string {
  if (pending) return "bg-amber-300 text-zinc-950";
  if (!slot.available && slot.kind === "free") {
    return "bg-zinc-900 text-zinc-600";
  }
  if (slot.kind === "booked") {
    if (slot.status === "completed") return "bg-zinc-600 text-zinc-100";
    if (slot.status === "no_show") return "bg-orange-700 text-white";
    if (slot.status === "left") return "bg-zinc-700 text-zinc-300 line-through";
    if (slot.isLate) return "bg-yellow-500 text-zinc-950";
    if (slot.source === "walk_in") return "bg-rose-700 text-white";
    if (slot.source === "phone") return "bg-teal-700 text-white";
    if (slot.source === "chat") return "bg-indigo-700 text-white";
    return "bg-sky-700 text-white";
  }
  // Blocked: distinct from walk-in (rose solid) — dark red + border
  if (slot.kind === "blocked") return "border border-red-400/70 bg-red-950 text-red-100";
  return "bg-emerald-700 text-white";
}

export function QuickBlockGrid({
  columns,
  pendingKey,
  outcomePendingKey = null,
  latePendingKey = null,
  cancelPendingKey = null,
  editableBarberId = null,
  onFreeSlot,
  onWalkInQuick,
  onOutcome,
  onLateCalled,
  onCancel,
  onRescheduleStart,
  onUnblock,
  bookingHref,
  onCopyBookingLink,
  bookingLinkCopied = false,
}: QuickBlockGridProps) {
  const { locale, t } = useI18n();
  const now = Date.now();
  const [sheet, setSheet] = useState<{
    barberId: string;
    barberName: string;
    slot: AdminSlot;
  } | null>(null);
  // Combined A+B: fit up to 5 barbers without horizontal scroll
  const colCount = Math.min(Math.max(columns.length, 1), 5);

  function handleSheetAction(action: BookedSlotSheetAction) {
    if (!sheet) return;
    const { barberId, slot } = sheet;
    if (action === "cancel") {
      onCancel?.(barberId, slot);
      setSheet(null);
      return;
    }
    if (action === "reschedule") {
      onRescheduleStart?.(barberId, slot);
      setSheet(null);
      return;
    }
    if (action === "late_called") {
      onLateCalled?.(barberId, slot);
      setSheet(null);
      return;
    }
    onOutcome?.(barberId, slot, action);
    setSheet(null);
  }

  if (columns.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-10 text-center">
        <p className="text-sm text-zinc-400">{t("admin.noQueueToday")}</p>
        {bookingHref ? (
          <Link
            href={bookingHref}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            {t("admin.nav.booking")}
          </Link>
        ) : null}
        {onCopyBookingLink ? (
          <button
            type="button"
            onClick={onCopyBookingLink}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
          >
            {bookingLinkCopied ? t("admin.bookingLinkCopied") : t("admin.copyBookingLink")}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <>
    <div
      className="grid gap-1.5 pb-1"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
    >
      {columns.map((column) => {
        const canEdit =
          editableBarberId === null || column.barber.id === editableBarberId;
        return (
          <div key={column.barber.id} className="flex min-w-0 flex-col gap-1.5">
            <div className="rounded-lg bg-zinc-900 px-1 py-2 text-center">
              <div className="truncate text-xs font-semibold sm:text-sm">
                {barberLabel(column.barber.name, locale)}
              </div>
              <div className="text-[10px] text-zinc-400">
                {column.barber.slot_duration_minutes} {t("common.minutes")}
              </div>
              {canEdit && onWalkInQuick ? (
                <button
                  type="button"
                  onClick={() => onWalkInQuick(column.barber.id)}
                  className="mt-1 min-h-11 w-full rounded-md bg-rose-700/80 px-1 py-1 text-[11px] font-semibold text-white"
                >
                  {t("admin.addWalkIn")}
                </button>
              ) : null}
            </div>
            {column.slots.length === 0 ? (
              <p className="px-1 text-center text-xs text-zinc-500">{t("admin.off")}</p>
            ) : (
              column.slots.map((slot) => {
                const key = `${column.barber.id}:${slot.startTime}`;
                const pending = pendingKey === key;
                const outcomePending = outcomePendingKey === key;
                const latePending = latePendingKey === key;
                const cancelPending = cancelPendingKey === key;
                const pastFree = slot.kind === "free" && !slot.available;
                const booked = slot.kind === "booked";
                const locked = slot.kind === "blocked" && slot.reason === "break";
                const blockedManual = slot.kind === "blocked" && slot.reason !== "break";
                const actions = getBookedCardActions(slot, { canEdit, nowMs: now });
                const sheetOpenable =
                  actions.canOpenSheet && Boolean(onOutcome || onCancel || onLateCalled);
                const label =
                  slot.kind === "booked"
                    ? slot.status === "completed"
                      ? `${slot.customerName} · ${t("admin.completed")}`
                      : slot.status === "no_show"
                        ? `${slot.customerName} · ${t("admin.noShow")}`
                        : slot.status === "left"
                          ? `${slot.customerName} · ${t("admin.left")}`
                          : slot.isLate
                            ? `${slot.customerName} · ${slot.lateCalledAt ? t("admin.called") : t("admin.late")}`
                            : slot.customerName
                    : slot.kind === "blocked"
                      ? slot.reason === "break"
                        ? t("admin.break")
                        : slot.reason || t("admin.walkIn")
                      : t("admin.free");

                if (sheetOpenable) {
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      aria-label={t("admin.openBookingActions")}
                      disabled={outcomePending || latePending || cancelPending}
                      onClick={() =>
                        setSheet({
                          barberId: column.barber.id,
                          barberName: column.barber.name,
                          slot,
                        })
                      }
                      className={`min-h-14 rounded-lg px-1 py-1.5 text-left transition disabled:opacity-60 ${slotClass(slot, outcomePending || latePending || cancelPending)}`}
                    >
                      <div className="text-[11px] font-bold sm:text-xs">
                        {formatSlotTime(slot.startTime)}
                      </div>
                      <div className="truncate text-[10px] font-medium leading-tight sm:text-[11px]">
                        {slot.customerName}
                      </div>
                      {slot.source ? (
                        <div className="truncate text-[9px] opacity-90">
                          {sourceBadge(slot.source, t, slot.viaQr)}
                        </div>
                      ) : null}
                      {(slot.noShowCount ?? 0) > 0 ? (
                        <div
                          className={`mt-0.5 truncate text-[9px] font-semibold ${
                            (slot.noShowCount ?? 0) >= NO_SHOW_WARNING_THRESHOLD
                              ? "rounded bg-orange-950/50 px-0.5 text-orange-200"
                              : "opacity-90"
                          }`}
                        >
                          {(slot.noShowCount ?? 0) >= NO_SHOW_WARNING_THRESHOLD ? "⚠ " : ""}
                          {t("admin.noShowCountShort").replace(
                            "{n}",
                            String(slot.noShowCount ?? 0),
                          )}
                        </div>
                      ) : null}
                      {slot.customerPhone ? (
                        <div className="mt-0.5 truncate text-[9px] font-semibold underline">
                          {slot.customerPhone}
                        </div>
                      ) : null}
                      <div className="mt-1 rounded bg-zinc-950/40 px-1 py-1 text-center text-[9px] font-semibold">
                        {t("admin.tapForActions")}
                      </div>
                    </button>
                  );
                }

                if (blockedManual && canEdit && onUnblock) {
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={pending}
                      onClick={() => onUnblock(column.barber.id, slot)}
                      className={`min-h-14 rounded-lg px-1 py-1.5 text-left transition ${slotClass(slot, pending)}`}
                    >
                      <div className="text-[11px] font-bold sm:text-xs">{formatSlotTime(slot.startTime)}</div>
                      <div className="truncate text-[10px] leading-tight">{label}</div>
                    </button>
                  );
                }

                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={pending || booked || pastFree || locked || !canEdit}
                    onClick={() => onFreeSlot(column.barber.id, slot)}
                    className={`min-h-14 rounded-lg px-1 py-1.5 text-left transition disabled:cursor-default ${slotClass(slot, pending)}`}
                  >
                    <div className="text-[11px] font-bold sm:text-xs">{formatSlotTime(slot.startTime)}</div>
                    <div className="truncate text-[10px] leading-tight sm:text-[11px]">{label}</div>
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
    <BookedSlotActionsSheet
      open={Boolean(sheet)}
      barberId={sheet?.barberId ?? ""}
      barberName={sheet?.barberName ?? ""}
      slot={sheet?.slot ?? { startTime: "", endTime: "", available: false, kind: "free" }}
      pending={Boolean(
        sheet &&
          (outcomePendingKey === `${sheet.barberId}:${sheet.slot.startTime}` ||
            latePendingKey === `${sheet.barberId}:${sheet.slot.startTime}` ||
            cancelPendingKey === `${sheet.barberId}:${sheet.slot.startTime}`),
      )}
      onClose={() => setSheet(null)}
      onAction={handleSheetAction}
    />
    </>
  );
}
