"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  getBookedCardActions,
  type BoardCardActionFlags,
} from "@/lib/admin/board-card-actions";
import { NO_SHOW_WARNING_THRESHOLD } from "@/lib/admin/customer-no-show";
import { formatSlotTime } from "@/lib/services/slot-service";
import { barberLabel, type AdminSlot } from "@/types/booking";

export type BookedSlotSheetAction =
  | "completed"
  | "left"
  | "no_show"
  | "late_called"
  | "cancel"
  | "reschedule"
  | "change_service";

interface BookedSlotActionsSheetProps {
  open: boolean;
  barberId: string;
  barberName: string;
  slot: AdminSlot;
  pending: boolean;
  onClose: () => void;
  onAction: (action: BookedSlotSheetAction) => void;
}

export function BookedSlotActionsSheet({
  open,
  barberName,
  slot,
  pending,
  onClose,
  onAction,
}: BookedSlotActionsSheetProps) {
  const { t, locale } = useI18n();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const flags: BoardCardActionFlags = getBookedCardActions(slot, { canEdit: true });

  useEffect(() => {
    if (!open) setConfirmCancel(false);
  }, [open, slot.appointmentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        onClick={onClose}
        disabled={pending}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booked-slot-sheet-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-zinc-950 px-4 pb-8 pt-4 shadow-xl sm:rounded-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <div className="mb-4">
          <h2 id="booked-slot-sheet-title" className="text-base font-semibold text-zinc-50">
            {confirmCancel ? t("admin.confirmCancelTitle") : t("admin.bookingActionsTitle")}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {barberLabel(barberName, locale)} · {formatSlotTime(slot.startTime)}
            {slot.customerName ? ` · ${slot.customerName}` : ""}
            {slot.status === "completed" && slot.priceBaht != null
              ? ` · ${t("admin.completedPrice").replace("{price}", String(slot.priceBaht))}`
              : ""}
            {slot.status === "completed" && slot.serviceName
              ? ` · ${slot.serviceName}`
              : ""}
          </p>
          {(slot.noShowCount ?? 0) > 0 ? (
            <p
              className={`mt-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                (slot.noShowCount ?? 0) >= NO_SHOW_WARNING_THRESHOLD
                  ? "bg-orange-950/60 text-orange-200"
                  : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {(slot.noShowCount ?? 0) >= NO_SHOW_WARNING_THRESHOLD
                ? t("admin.noShowWarningBadge").replace("{n}", String(slot.noShowCount ?? 0))
                : t("admin.noShowCountDetail").replace("{n}", String(slot.noShowCount ?? 0))}
            </p>
          ) : null}
        </div>

        {confirmCancel ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-300">
              {flags.cancelNotifiesLine
                ? t("admin.confirmCancelBodyLine")
                : t("admin.confirmCancelBodyNoLine")}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => onAction("cancel")}
              className="cq-press min-h-12 rounded-xl bg-rose-600 font-semibold text-white disabled:opacity-50"
            >
              {t("admin.confirmCancelAction")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmCancel(false)}
              className="cq-press min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-200 disabled:opacity-50"
            >
              {t("common.back")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {flags.canComplete ? (
              <ActionButton
                disabled={pending}
                onClick={() => onAction("completed")}
                primary
              >
                ✓ {t("admin.markDone")}
              </ActionButton>
            ) : null}
            {flags.canChangeService ? (
              <ActionButton
                disabled={pending}
                onClick={() => onAction("change_service")}
                primary
              >
                {t("admin.changeServiceAction")}
              </ActionButton>
            ) : null}
            {flags.canLeft ? (
              <ActionButton disabled={pending} onClick={() => onAction("left")}>
                {t("admin.markLeft")}
              </ActionButton>
            ) : null}
            {flags.canNoShow ? (
              <ActionButton disabled={pending} onClick={() => onAction("no_show")}>
                ✗ {t("admin.markNoShow")}
              </ActionButton>
            ) : null}
            {flags.canLateCalled ? (
              <ActionButton disabled={pending} onClick={() => onAction("late_called")}>
                📞 {t("admin.markCalled")}
              </ActionButton>
            ) : null}
            {flags.canCall && slot.customerPhone ? (
              <a
                href={`tel:${slot.customerPhone}`}
                className="cq-press flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100"
              >
                📞 {t("admin.callCustomer")} {slot.customerPhone}
              </a>
            ) : null}
            {flags.canReschedule ? (
              <ActionButton disabled={pending} onClick={() => onAction("reschedule")}>
                {t("admin.rescheduleBooking")}
              </ActionButton>
            ) : null}
            {flags.canCancel ? (
              <ActionButton
                disabled={pending}
                danger
                onClick={() => setConfirmCancel(true)}
              >
                {t("admin.cancelBooking")}
              </ActionButton>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="mt-1 min-h-11 rounded-xl text-sm text-zinc-400 disabled:opacity-50"
            >
              {t("admin.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  const className = primary
    ? "cq-press min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
    : danger
      ? "cq-press min-h-12 rounded-xl border border-rose-500/60 font-semibold text-rose-300 disabled:opacity-50"
      : "cq-press min-h-12 rounded-xl border border-zinc-700 font-semibold text-zinc-100 disabled:opacity-50";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
