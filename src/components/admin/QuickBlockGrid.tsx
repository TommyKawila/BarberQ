"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookedSlotActionsSheet,
  type BookedSlotSheetAction,
} from "@/components/admin/BookedSlotActionsSheet";
import { getBookedCardActions } from "@/lib/admin/board-card-actions";
import { blockedSlotLabel, isStaffBlockReason } from "@/lib/admin/block-time";
import { NO_SHOW_WARNING_THRESHOLD } from "@/lib/admin/customer-no-show";
import { lateMinutesSinceStart } from "@/lib/admin/free-status-copy";
import {
  analyzePreOpen,
  shouldHideUnderPreOpenCollapse,
} from "@/lib/admin/pre-open-row";
import { useI18n } from "@/lib/i18n/locale-provider";
import { dateISOFromInstant, formatSlotTime } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";
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
  shopHours?: ShopHours | null;
  /** Board day (yyyy-MM-dd Bangkok). Defaults to today. */
  dateISO?: string | null;
  onFreeSlot: (barberId: string, slot: AdminSlot) => void;
  onWalkInQuick?: (barberId: string) => void;
  /** Optional shop-level banner shown once above the grid (e.g. before open). */
  walkInShopBanner?: string | null;
  onOutcome?: (
    barberId: string,
    slot: AdminSlot,
    outcome: "completed" | "no_show" | "left",
  ) => void;
  onChangeService?: (barberId: string, slot: AdminSlot) => void;
  onLateCalled?: (barberId: string, slot: AdminSlot) => void;
  onCancel?: (barberId: string, slot: AdminSlot) => void;
  onRescheduleStart?: (barberId: string, slot: AdminSlot) => void;
  onUnblock?: (barberId: string, slot: AdminSlot) => void;
  /** When true, free cells pulse so staff can pick the new slot after เลื่อนคิว. */
  reschedulePickMode?: boolean;
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
    return viaQr ? `${t("admin.sourceWalkIn")} · QR` : t("admin.sourceWalkIn");
  }
  if (source === "phone") return t("admin.sourcePhone");
  if (source === "chat") return t("admin.sourceChat");
  return t("admin.sourceLine");
}

/** Round-1 slot surfaces: free = dashed outline; booked = raised + gold rail. */
function slotClass(slot: AdminSlot, pending: boolean): string {
  if (pending) return "bg-amber-300 text-zinc-950";
  if (!slot.available && slot.kind === "free") {
    return "border border-transparent bg-zinc-950 text-zinc-600";
  }
  if (slot.kind === "booked") {
    if (slot.status === "completed") {
      return "border border-zinc-700 bg-cq-fill-outline text-zinc-100";
    }
    if (slot.status === "no_show") return "border border-orange-500/60 bg-orange-950 text-orange-50";
    if (slot.status === "left") {
      return "border border-zinc-700 bg-cq-fill-strong text-zinc-300 line-through";
    }
    // Active booked — gold left rail on raised surface (no green / no solid sky fill)
    return "border border-zinc-700 bg-zinc-800 text-zinc-50 shadow-[inset_3px_0_0_0_var(--cq-amber)]";
  }
  if (slot.kind === "blocked") {
    if (slot.reason === "break" || slot.reason === "day_off") {
      return "border border-zinc-700 bg-zinc-950 text-zinc-500";
    }
    return "border border-red-400/70 bg-red-950 text-red-100";
  }
  // Free / available — dashed outline #857C70 (= zinc-700 / cq-border-strong)
  return "border border-dashed border-zinc-700 bg-transparent text-zinc-400";
}

export function QuickBlockGrid({
  columns,
  pendingKey,
  outcomePendingKey = null,
  latePendingKey = null,
  cancelPendingKey = null,
  editableBarberId = null,
  shopHours = null,
  dateISO = null,
  onFreeSlot,
  onOutcome,
  onChangeService,
  onLateCalled,
  onCancel,
  onRescheduleStart,
  onUnblock,
  reschedulePickMode = false,
  bookingHref,
  onCopyBookingLink,
  bookingLinkCopied = false,
  walkInShopBanner = null,
}: QuickBlockGridProps) {
  const { locale, t } = useI18n();
  const now = Date.now();
  const boardDate = dateISO ?? dateISOFromInstant(new Date());
  const preOpen = useMemo(
    () => analyzePreOpen(columns, shopHours, boardDate),
    [columns, shopHours, boardDate],
  );
  /** Expand collapsed all-free pre-open row so staff can tap free slots. */
  const [preOpenExpanded, setPreOpenExpanded] = useState(false);
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
    if (action === "change_service") {
      onChangeService?.(barberId, slot);
      setSheet(null);
      return;
    }
    if (action === "completed" || action === "no_show" || action === "left") {
      onOutcome?.(barberId, slot, action);
      setSheet(null);
    }
  }

  if (columns.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-10 text-center">
        <p className="text-sm text-zinc-400">{t("admin.noQueueToday")}</p>
        {onCopyBookingLink ? (
          <button
            type="button"
            onClick={onCopyBookingLink}
            className="min-h-11 rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-100"
          >
            {bookingLinkCopied ? t("admin.bookingLinkCopied") : t("admin.copyBookingLink")}
          </button>
        ) : null}
        {bookingHref ? (
          /^https?:\/\//i.test(bookingHref) ? (
            <a
              href={bookingHref}
              className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
              data-testid="admin-empty-booking-link"
            >
              {t("admin.nav.booking")}
            </a>
          ) : (
            <Link
              href={bookingHref}
              className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
            >
              {t("admin.nav.booking")}
            </Link>
          )
        ) : null}
      </section>
    );
  }

  return (
    <>
    {walkInShopBanner ? (
      <p
        className="mb-2 rounded-lg border border-amber-500/50 bg-amber-950 px-3 py-2 text-center text-sm font-medium text-amber-50"
        data-testid="walk-in-shop-banner"
        role="status"
      >
        {walkInShopBanner}
      </p>
    ) : null}
    {preOpen ? (
      preOpen.allFree ? (
        <button
          type="button"
          className="mb-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-center text-xs font-medium text-zinc-400"
          data-testid="pre-open-row"
          aria-expanded={preOpenExpanded}
          onClick={() => setPreOpenExpanded((v) => !v)}
        >
          {t("admin.preOpenRow").replace("{from}", preOpen.from).replace("{to}", preOpen.to)}
          {preOpenExpanded ? " · ▴" : " · ▾"}
        </button>
      ) : (
        <div
          className="mb-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-center text-xs font-medium text-zinc-400"
          data-testid="pre-open-row"
        >
          {t("admin.preOpenRow").replace("{from}", preOpen.from).replace("{to}", preOpen.to)}
        </div>
      )
    ) : null}
    <div
      className="grid gap-1.5 pb-1"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
    >
      {columns.map((column) => {
        const canEdit =
          editableBarberId === null || column.barber.id === editableBarberId;
        const visibleSlots = (column.slots ?? []).filter(
          (slot) => !shouldHideUnderPreOpenCollapse(slot, preOpen, preOpenExpanded),
        );
        return (
          <div key={column.barber.id} className="flex min-w-0 flex-col gap-1.5">
            <div className="rounded-lg bg-zinc-900 px-1 py-2 text-center">
              <div className="truncate text-xs font-semibold sm:text-sm">
                {barberLabel(column.barber.name, locale)}
              </div>
              <div className="text-xs text-zinc-400">
                {column.barber.slot_duration_minutes} {t("common.minutes")}
              </div>
            </div>
            {visibleSlots.length === 0 ? (
              <p className="px-1 text-center text-xs text-zinc-500">{t("admin.off")}</p>
            ) : (
              visibleSlots.map((slot) => {
                const key = `${column.barber.id}:${slot.startTime}`;
                const pending = pendingKey === key;
                const outcomePending = outcomePendingKey === key;
                const latePending = latePendingKey === key;
                const cancelPending = cancelPendingKey === key;
                const pastFree = slot.kind === "free" && !slot.available;
                const booked = slot.kind === "booked";
                const locked = slot.kind === "blocked" && slot.reason === "break";
                const blockedManual =
                  slot.kind === "blocked" && isStaffBlockReason(slot.reason);
                const actions = getBookedCardActions(slot, { canEdit, nowMs: now });
                const sheetOpenable =
                  actions.canOpenSheet &&
                  Boolean(onOutcome || onCancel || onLateCalled || onChangeService);
                const freeLabel = t("admin.freeSlotPlus");
                const lateN =
                  slot.isLate && slot.kind === "booked"
                    ? lateMinutesSinceStart(slot.appointmentStart ?? slot.startTime)
                    : 0;
                const label =
                  slot.kind === "booked"
                    ? slot.status === "completed"
                      ? slot.priceBaht != null
                        ? `${slot.customerName} · ${t("admin.completedWithPrice").replace("{price}", String(slot.priceBaht))}`
                        : `${slot.customerName} · ${t("admin.completed")}`
                      : slot.status === "no_show"
                        ? `${slot.customerName} · ${t("admin.noShow")}`
                        : slot.status === "left"
                          ? `${slot.customerName} · ${t("admin.left")}`
                          : slot.customerName
                    : slot.kind === "blocked"
                      ? blockedSlotLabel(slot.reason, (k) => t(k as Parameters<typeof t>[0]))
                      : freeLabel;

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
                        <div className="truncate text-[9px] text-zinc-400">
                          {sourceBadge(slot.source, t, slot.viaQr)}
                        </div>
                      ) : null}
                      {slot.isLate ? (
                        <div className="mt-0.5 inline-flex rounded-full bg-[var(--cq-warning-chip)] px-1.5 py-0.5 text-[9px] font-semibold text-zinc-950">
                          {slot.lateCalledAt
                            ? t("admin.called")
                            : lateN < 1
                              ? t("admin.lateChip")
                              : t("admin.lateMinutesChip").replace("{n}", String(lateN))}
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
                      {slot.status === "completed" && slot.priceBaht != null ? (
                        <div className="mt-0.5 truncate text-[9px] font-semibold text-amber-100">
                          {t("admin.completedWithPrice").replace(
                            "{price}",
                            String(slot.priceBaht),
                          )}
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
                      data-testid={`blocked-slot-${slot.blockId ?? slot.startTime}`}
                      onClick={() => onUnblock(column.barber.id, slot)}
                      className={`cq-press min-h-14 rounded-lg px-1 py-1.5 text-left transition ${slotClass(slot, pending)}`}
                    >
                      <div className="text-[11px] font-bold sm:text-xs">{formatSlotTime(slot.startTime)}</div>
                      <div className="truncate text-[10px] leading-tight">{label}</div>
                      <div className="mt-1 rounded bg-zinc-950/40 px-1 py-0.5 text-center text-[9px] font-semibold">
                        {t("admin.tapForActions")}
                      </div>
                    </button>
                  );
                }

                const freePickable =
                  reschedulePickMode &&
                  slot.kind === "free" &&
                  slot.available &&
                  canEdit &&
                  !pending &&
                  !pastFree &&
                  !locked;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={pending || booked || pastFree || locked || !canEdit}
                    onClick={() => onFreeSlot(column.barber.id, slot)}
                    className={`min-h-14 rounded-lg px-1 py-1.5 text-left transition disabled:cursor-default ${slotClass(slot, pending)}${
                      freePickable
                        ? " ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-950 animate-pulse"
                        : reschedulePickMode && booked
                          ? " opacity-40"
                          : ""
                    }`}
                  >
                    <div className="text-[11px] font-bold sm:text-xs">{formatSlotTime(slot.startTime)}</div>
                    <div className="truncate text-[10px] leading-tight sm:text-[11px]">{label}</div>
                    {freePickable ? (
                      <div className="mt-1 rounded bg-amber-400/90 px-1 py-0.5 text-center text-[9px] font-semibold text-zinc-950">
                        {t("admin.rescheduleTapSlot")}
                      </div>
                    ) : null}
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
